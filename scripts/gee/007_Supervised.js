/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var points = ee.FeatureCollection("users/ddel528/AccuracyAssessment_Iloilo_v2"),
    dry = ee.Image("users/ddel528/imageStats4/imageStats4_decadal_dry_2019"),
    annual = ee.Image("users/ddel528/imageStats4/imageStats4_decadal_annual_2019"),
    wet = ee.Image("users/ddel528/imageStats4/imageStats4_decadal_wet_2019");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Compiled image
var image = ee.Image.cat([dry,annual]);

// Label
var label = 'class'
print(points)
// Load watersheds from a data table.
var points = points
  // Convert 'areasqkm' property from string to number.
  .map(function(feature){
    var num = ee.Number.parse(feature.get('class'));
    return feature.set('class', num);
  });
print(points)

// Overlay the points on the imagery to get training.
var training = image.sampleRegions({
  collection: points,
  properties: [label],
  scale: 10
});

// Train a CART classifier with default parameters.
var trained = ee.Classifier.smileCart().train(training, label);

// Classify the image with the same bands used for training.
var classified = image.classify(trained);

// Display the inputs and the results.
Map.centerObject(points, 11);
// Map.addLayer(image, {bands: ['B4', 'B3', 'B2'], max: 0.4}, 'image');
Map.addLayer(classified,
            {min: 1, max: 5, palette: ['green','red','pink','yellow','cyan']},
            'dry');

// Compiled image
var image = ee.Image.cat([wet,annual]);

// Label
var label = 'class'
print(points)
// Load watersheds from a data table.
var points = points
  // Convert 'areasqkm' property from string to number.
  .map(function(feature){
    var num = ee.Number.parse(feature.get('class'));
    return feature.set('class', num);
  });
print(points)

// Overlay the points on the imagery to get training.
var training = image.sampleRegions({
  collection: points,
  properties: [label],
  scale: 10
});

// Train a CART classifier with default parameters.
var trained = ee.Classifier.smileCart().train(training, label);

// Classify the image with the same bands used for training.
var classified = image.classify(trained);

// Display the inputs and the results.
Map.centerObject(points, 11);
// Map.addLayer(image, {bands: ['B4', 'B3', 'B2'], max: 0.4}, 'image');
Map.addLayer(classified,
            {min: 1, max: 5, palette: ['green','red','pink','yellow','cyan']},
            'wet');

// Compiled image
var image = ee.Image.cat([dry,wet,annual]);

// Label
var label = 'class'
print(points)
// Load watersheds from a data table.
var points = points
  // Convert 'areasqkm' property from string to number.
  .map(function(feature){
    var num = ee.Number.parse(feature.get('class'));
    return feature.set('class', num);
  });
print(points)

// Overlay the points on the imagery to get training.
var training = image.sampleRegions({
  collection: points,
  properties: [label],
  scale: 10
});

// Train a CART classifier with default parameters.
var trained = ee.Classifier.smileCart().train(training, label);

// Classify the image with the same bands used for training.
var classified = image.classify(trained);

// Display the inputs and the results.
Map.centerObject(points, 11);
// Map.addLayer(image, {bands: ['B4', 'B3', 'B2'], max: 0.4}, 'image');
Map.addLayer(classified,
            {min: 1, max: 5, palette: ['green','red','pink','yellow','cyan']},
            'wet, dry, annual');
