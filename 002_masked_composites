/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var annual = ee.Image("users/ddel528/imageStats3/imageStats3_decadal_annual_2019"),
    first = ee.Image("users/ddel528/imageStats3/imageStats3_decadal_1st_2019"),
    second = ee.Image("users/ddel528/imageStats3/imageStats3_decadal_2nd_2019"),
    wet = ee.Image("users/ddel528/imageStats3/imageStats3_decadal_wet_2019"),
    dry = ee.Image("users/ddel528/imageStats3/imageStats3_decadal_dry_2019"),
    srtm = ee.Image("CGIAR/SRTM90_V4"),
    geometry = 
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
          [122.41285914233686, 11.440743530010431]]]),
    table = ee.FeatureCollection("users/ddel528/ph3adm_iloilo_dissolved");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var urban = annual.select("GCVI_mean").gte(0.5).or(annual.select("GCVI_median").gte(0.42));
var forest = annual.select("GCVI_mean").lte(1.55).or(annual.select("GCVI_median").lte(1.55));

// Apply slope algorithm to SRTM image
var slope = ee.Terrain.slope(srtm);

// Simple averaging thresholds using elevation and slope values
var slopeMask = slope.lte(3); // slope less than 2 deg
var elevationMask = srtm.lte(1000); // elevation less than 1500 masl

var updatemask = annual.updateMask(urban).updateMask(forest).updateMask(slopeMask).updateMask(elevationMask);

// Visualize the layer of the mask
Map.addLayer(updatemask.select('GCVI_stdDev'), {palette:['red','orange','green']},'updatemask', false);

// var a = updatemask.mask();
// print(a)
// Map.addLayer(a.select('GCVI_mean'), {},'unmask', true);

// Add boundary for the AOI
Map.addLayer(ee.Image().paint(geometry.buffer(10000), 0, 2), null, 'geomtery boundary', true);
Map.centerObject(geometry, 9);

// Make the training dataset.
var training = updatemask.sample({
  region: table, // formerly geometry so narrowed the sample area
  scale: 10,
  numPixels: 5000,
  geometries: true
});

// Instantiate the clusterer and train it.
var clusterer = ee.Clusterer.wekaKMeans(50).train(training);

// Cluster the input using the trained clusterer.
var result = updatemask.cluster(clusterer);

// Display the clusters with random colors.
Map.addLayer(result.randomVisualizer().clip(table), {}, 'clusters');

// Draw Iloilo Provincial Boundary
Map.addLayer(ee.Image().paint(table, 0, 2), null, 'iloilo bdry', true);

Map.addLayer(training, {palette: 'FF0000'}, 'training');

//// NEXT STEPS:
// LIMIT TO ONLY ILOILO AREA and sample the RESULT of classification
var timeSeriesSamples = result.sample({
  region: table,
  scale: 10,
  numPixels: 500,
  geometries: true,
  seed: 10
});

Map.addLayer(timeSeriesSamples, null, 'timeSeriesSamples');
print(timeSeriesSamples);

//EXTRACT THE TIME SERIES PROFILE; RECLASSIFY; USE OBJECT-BASED FOR REFINEMENT
Export.table.toAsset(timeSeriesSamples, 'timeSeriesSamples_01', 'timeSeriesSamples_01');

Export.image.toAsset({
  image: result, 
  description: 'cluster_initial_v01', 
  assetId: 'cluster_initial_v01', 
  region: geometry, 
  scale: 10, 
  maxPixels: 1e13
});

/**/