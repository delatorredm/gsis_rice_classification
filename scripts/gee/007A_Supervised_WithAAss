/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var alos = ee.Image("JAXA/ALOS/AW3D30/V2_2"),
    points = ee.FeatureCollection("users/ddel528/AccuracyAssessment_Iloilo_v2"),
    dry = ee.Image("users/ddel528/imageStats4/imageStats4_decadal_dry_2019"),
    annual = ee.Image("users/ddel528/imageStats4/imageStats4_decadal_annual_2019"),
    wet = ee.Image("users/ddel528/imageStats4/imageStats4_decadal_wet_2019"),
    iloilo_bdy = ee.FeatureCollection("users/ddel528/ph3adm_iloilo_dissolved"),
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
// Load in libraries
var geet = require('users/elacerda/geet:geet'); // https://github.com/sacridini/GEET

// WHICH SEASON? WET OR DRY OR BOTH [remember to change the filename at the end]
var image = ee.Image.cat([wet,annual]);

// Select the DSM layer in ALOS-PALSAR data
var dsm = alos.select('AVE_DSM');

// // Urban and Forest Masks
// var urban = annual.select("GCVI_mean").gte(0.5).or(annual.select("GCVI_median").gte(0.42));
// var forest = annual.select("GCVI_mean").lte(1.55).or(annual.select("GCVI_median").lte(1.55));

// Apply slope algorithm to ALOS image 
var slope = ee.Terrain.slope(dsm);

// Simple averaging thresholds using elevation and slope values
var slopeMask = slope.lte(5); // slope less than 2 deg
var elevationMask = dsm.lte(2000); // elevation less than 1500 masl
// image =  image.updateMask(urban)
//               .updateMask(forest)
//               .updateMask(slopeMask)
//               .updateMask(elevationMask);

// Label
var label = 'class';

// Load watersheds from a data table.
var points = points
  // Convert 'areasqkm' property from string to number.
  .map(function(feature){
    var num = ee.Number.parse(feature.get('class'));
    return feature.set('class', num);
  });
print(points);

// Overlay the points on the imagery to get training.
var sample = image.sampleRegions({
  collection: points,
  properties: [label],
  scale: 10
});

// The randomColumn() method will add a column of uniform random
// numbers in a column named 'random' by default.
var withRandom = sample.randomColumn({columnName: 'random', seed: 0});

// We want to reserve some of the data for testing, to avoid overfitting the model.
var split = 0.70;  // Roughly 70% training, 30% testing.
var training = withRandom.filter(ee.Filter.lt('random', split));
var validation = withRandom.filter(ee.Filter.gte('random', split));
print('Training', training, 'Validation', validation)
var bands = image.bandNames();

// Make a Random Forest classifier and train it.
var classifier = ee.Classifier.smileRandomForest({
  numberOfTrees: 300,
  minLeafPopulation: 10
});

classifier = classifier.train({
      features: training,
      classProperty: label,
      inputProperties: bands
    });

// Classify the image with the same bands used for training.
var classified = image.classify(classifier);

// Display the inputs and the results.
Map.centerObject(points, 11);
// Map.addLayer(image, {bands: ['B4', 'B3', 'B2'], max: 0.4}, 'image');
Map.addLayer(classified,
            {min: 1, max: 5, palette: ['green','red','pink','yellow','cyan']},
            'wet, dry, annual',
            false);

print('Classified Map', classified);

// Classify the validation data.
var validated = validation.classify(classifier);

// Get a confusion matrix representing expected accuracy.
var testAccuracy = validated.errorMatrix('class', 'classification');
print('Validation error matrix: ', testAccuracy);
print('Validation overall accuracy: ', testAccuracy.accuracy());
print('Validation consumers accuracy: ', testAccuracy.consumersAccuracy());
print('Validation producers accuracy: ', testAccuracy.producersAccuracy());
print('Validation kappa: ', testAccuracy.kappa());

// OTHER LAYERS==================

// WATER
var water = ee.Image('JRC/GSW1_2/GlobalSurfaceWater').select('occurrence').gte(40).remap([1],[6]); // Assign water to [6]
var gsw_visualization = {
  palette: ['0000ff']
};

Map.addLayer(water, gsw_visualization, 'Water Occurrence', false);

// Add Iloilo Boundary
Map.addLayer(ee.Image().paint(iloilo_bdy, 0, 2), {palette:['red']}, "Iloilo Province", false);

// URBAN AND FOREST (FLIPPED RULESETS)
var urban = annual.select("GCVI_mean").lte(0.5).or(annual.select("GCVI_median").lte(0.42)).remap([1],[2]);
var forest = annual.select("GCVI_mean").gte(1.55).or(annual.select("GCVI_median").gte(1.55)).remap([1],[1]);


// // Mask and mosaic visualization images.  The last layer is on top.
// var mosaic = ee.ImageCollection([
//   classified.visualize({min: 1, max: 5, palette: ['green','red','pink','yellow','cyan']}),
//   forest.visualize({palette:['green']}),
//   urban.visualize({palette:['red']}),
//   water.visualize(gsw_visualization)
//   ]).mosaic();

var mosaic = ee.ImageCollection([
  classified.rename('class').toByte(), 
  forest.rename('class').toByte(), 
  urban.rename('class').toByte(), 
  water.rename('class').toByte()
  ]).mosaic().toByte();

print('Mosaic', mosaic);

Map.addLayer(mosaic, {min: 1, max: 6, palette: ['green','red','pink','yellow','cyan','blue']}, 'Visualization mosaic');
// Map.addLayer(roi)
 
var image_majority = geet.majority(mosaic, 3);

Map.addLayer(image_majority, {
  palette:['green','red','pink','yellow','cyan','blue'], 
  min: 1, 
  max: 6
}, "majority geet", false);


// Weighted smoothing 
// using a 3x3 window
// euclidean distance weighting from corners
var weights = [[1,2,1],
               [2,3,2],
               [1,2,1]];

// create a 3x3 kernel with the weights
// kernel W and H must equal weight H and H
var kernel = ee.Kernel.fixed(3,3,weights);

var SCALE = 10;

// apply mode on neightborhood using weights
// and force operations to be done at native scale
var weighted_mode = mosaic.reduceNeighborhood({
  reducer: ee.Reducer.mode(),
  kernel: kernel
}).reproject('EPSG:4326', null, SCALE);

Map.addLayer(weighted_mode, {
  palette:['green','red','pink','yellow','cyan','blue'], 
  min: 1, 
  max: 6
}, "weighted mode", true);

Export.image.toDrive({
  image: weighted_mode, 
  description: 'weighted_mode_Iloilo_RandForest_wet_v001', 
  region: roi, 
  scale: 10, 
  maxPixels: 1e13, 
  fileFormat: 'GeoTIFF', 
});