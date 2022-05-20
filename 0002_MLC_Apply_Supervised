/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var unsup = ee.Image("users/ddel528/weighted_mode_Iloilo_v007_wet_final"),
    wet = ee.Image("users/ddel528/imageStats4/imageStats4_decadal_wet_2019"),
    dry = ee.Image("users/ddel528/imageStats4/imageStats4_decadal_dry_2019"),
    annual = ee.Image("users/ddel528/imageStats4/imageStats4_decadal_annual_2019"),
    iloilo_bdy = ee.FeatureCollection("users/ddel528/ph3adm_iloilo_dissolved"),
    points = ee.FeatureCollection("users/ddel528/sample_points_processed_v01"),
    decadal_composites = ee.Image("users/ddel528/imageStats4/imageStats4_decadal_composite_2019"),
    monthly_composites = ee.Image("users/ddel528/imageStats4/imageStats4_decadal_monthly_2019"),
    roi = 
    /* color: #98ff00 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[122.2617971306181, 11.206442548081636],
          [122.0970022087431, 10.947683207220571],
          [121.90748804858686, 10.861379565685638],
          [121.83058375171186, 10.648211017386133],
          [121.81959742358686, 10.348444242237656],
          [122.1189748649931, 10.375462125688077],
          [122.2343313103056, 10.559121579310926],
          [122.4320852165556, 10.599619992945886],
          [122.56117457202436, 10.605019377164805],
          [122.7342092399931, 10.683299719220116],
          [122.8605520134306, 10.858682173880291],
          [123.0637990837431, 11.017786414453603],
          [123.20387476733686, 11.10673950485222],
          [123.29176539233686, 11.306111229385102],
          [123.37416285327436, 11.518800988823061],
          [123.4373342399931, 11.693678450377291],
          [123.01710718921186, 11.621050359371225],
          [122.93470972827436, 11.532256985469294],
          [122.66554468921186, 11.491887064084096],
          [122.41285914233686, 11.440743530010431]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/


// Visualize initial data
Map.addLayer(unsup,
            {min: 1, max: 6, palette: ['green','red','cyan','yellow','pink','blue']},
            'unsupervised clustered',
            false);

// Visualize data with forest, urban and water mask
var unsup_masked = unsup.updateMask(unsup.gte(3).and(unsup.lte(5)));
Map.addLayer(unsup_masked,
            {min: 3, max: 5, palette: ['cyan','yellow','pink']},
            'masked classes',
            false);
            
// Map.addLayer(ee.Image().paint(iloilo_bdy, 0, 2), {palette:['red']}, "Iloilo Province", true);

// Convert to an imagecollection
var iloilo = ee.FeatureCollection(iloilo_bdy);
Map.addLayer(iloilo, 0, 'iloilo');

////==== CLASSIFICATION DATA ====?///

/// INPUT DATA ================= ///
var dry_decadal_comp = decadal_composites.bandNames().slice(0,38);
var wet_decadal_comp = decadal_composites.bandNames().slice(36, 74);

var dry_monthly_comp = monthly_composites.bandNames().slice(0,38);
var wet_monthly_comp = monthly_composites.bandNames().slice(36, 74);


var image = ee.Image([
  wet, 
  annual, 
  // monthly_composites.select(wet_monthly_comp)
  ]);//.updateMask(unsup.gte(3).and(unsup.lte(5)));
print('Input Image Properties', image);
Map.addLayer(image.select('GCVI_mean'), {
  palette:['red','yellow','green']}, 'testOutput',
  true);

// Label of input data
var label = 'class';

// Load reference points from a data table.
var points = points
  // Convert 'areasqkm' property from string to number.
  .map(function(feature){
    var num = ee.Number.parse(feature.get('class'));
    return feature.set('class', num);
  });
print('Reference Points Properties', points);

/* ========
TEST REMAPPING */

points = points.remap([3,4,5],[4,4,5], 'class');
print('Remapped Points Properties', points);

/*========
*/
// Overlay the points on the imagery to get training.
// stratifiedSample(numPoints, classBand, region, scale, projection, seed, classValues, classPoints, dropNulls, tileScale, geometries)
// sample(region, scale, projection, factor, numPixels, seed, dropNulls, tileScale, geometries)

var sample = image.sampleRegions({
  collection: points,
  properties: [label],
  scale: 10
});
// var sample = image.stratifiedSample({
//   region: points,
//   //properties: [label],
//   dropNulls: true,
//   scale: 10
// });

Map.addLayer(points, {}, 'Reference Points');
// The randomColumn() method will add a column of uniform random
// numbers in a column named 'random' by default.
var withRandom = sample.randomColumn({columnName: 'random', seed: 0});

// We want to reserve some of the data for testing, to avoid overfitting the model.
var split = 0.70;  // Roughly 70% training, 30% testing.
var training = withRandom.filter(ee.Filter.lt('random', split));
var validation = withRandom.filter(ee.Filter.gte('random', split));
print('Training', training, 'Validation', validation)
var bands = image.bandNames();

// // Make a Random Forest classifier and train it.
var classifier = ee.Classifier.smileRandomForest({
  numberOfTrees: 200,
  minLeafPopulation: 10,
  seed: 0
});

classifier = classifier.train({
      features: training,
      classProperty: label,
      inputProperties: bands
    });

// Classify the image with the same bands used for training.
var classified = image.classify(classifier);

// Classify the validation data.
var validated = validation.classify(classifier);

// Get a confusion matrix representing expected accuracy.
var testAccuracy = validated.errorMatrix('class', 'classification');
print('Validation error matrix: ', testAccuracy);
print('Validation overall accuracy: ', testAccuracy.accuracy());
print('Validation consumers accuracy: ', testAccuracy.consumersAccuracy());
print('Validation producers accuracy: ', testAccuracy.producersAccuracy());
print('Validation kappa: ', testAccuracy.kappa());

print('smileRandomForest, explained', classifier.explain());

// Display the inputs and the results.
Map.centerObject(points, 11);
Map.addLayer(classified.updateMask(unsup.gte(3).and(unsup.lte(5))),
            {min: 3, max: 5, palette: ['cyan','yellow','pink']},
            'classified random forest',
            true);

print('Classified Map', classified);

Export.image.toDrive({
  image: classified, 
  description: 'classified_wet_v001', 
  region: roi, 
  scale: 10, 
  maxPixels: 1e13, 
  fileFormat: 'GeoTIFF', 
});
