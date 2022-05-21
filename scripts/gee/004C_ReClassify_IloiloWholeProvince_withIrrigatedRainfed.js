/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var table = ee.FeatureCollection("users/ddel528/ph3adm_iloilo_dissolved"),
    exportGeometry = 
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
    dry = ee.Image("users/ddel528/cluster_initial_allComposites_dry_v107"),
    wet = ee.Image("users/ddel528/cluster_initial_allComposites_wet_v107");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Load in libraries
var geet = require('users/elacerda/geet:geet'); // https://github.com/sacridini/GEET

// Change for cluster of interest (wet or dry)

var clusterResult = wet;

Map.addLayer(clusterResult.randomVisualizer(), null, 'cluster result', true, 0.8);

// ONE CLUSTER ONLY
var oneCluster = clusterResult.select("cluster").eq(18).selfMask();
// Visualize single cluster on map
Map.addLayer(oneCluster,{palette:['cyan']},"cluster of Interest Only", true);

print(clusterResult);
/**=========================================================================
* REMAP CLASSES
* ====================================================================== */
// merge several clusters together 

  // Define your from and to values
  var fromForest =  ee.List([ 9,11,14,23]); // original values
  var toForest =    ee.List([ 1, 1, 1, 1]); // values to give to the pixels

  var fromBuildup = ee.List([ 3, 4,16,21,22]); // original values
  var toBuildup =   ee.List([ 2, 2, 2, 2, 2]); // values to give to the pixels


  var fromRainfed = ee.List([ 2,10,19]); // original values
  var toRainfed =   ee.List([ 3, 3, 3]);         // values to give to the pixels

  var fromIrrigated = ee.List([ 6, 8,13,15,20,24]);
  var toIrrigated =   ee.List([ 4, 4, 4, 4, 4, 4]);

  var fromOtherCrop = ee.List([ 0, 1, 5, 7,12,17,18]);
  var toOtherCrop =   ee.List([ 5, 5, 5, 5, 5, 5, 5]);

  // concatenate the lists
  var fromList = fromForest.cat(fromBuildup).cat(fromRainfed).cat(fromIrrigated).cat(fromOtherCrop);
  var toList = toForest.cat(toBuildup).cat(toRainfed).cat(toIrrigated).cat(toOtherCrop);
  // remap the pixel values and rename the bands accordingly
  // var Forest = clusterResult.remap(fromForest, toForest, 0, 'cluster').rename('Forest');
  // var Agricultural = clusterResult.remap(fromAgricultural, toAgricultural, 0, 'cluster').rename('Agricultural');
  // var Buildup = clusterResult.remap(fromBuildup, toBuildup, 0, 'cluster').rename('Buildup');
  var remapped = clusterResult.remap(fromList, toList, 0, 'cluster')
  
  // concatenate to one image
  // var image = ee.Image.cat([Buildup, Agricultural, Forest]);

  
/**=========================================================================
* VISUALIZE CLASSIFIER RESULT
* ====================================================================== */
var palette = [
  'green', // 1 = trees
  'red', //   2 = urban
  'pink', //  3 = rainfed
  'yellow', //4 = irrigated
  'cyan', //  5 = other crops
  ];
Map.addLayer(remapped.clip(table), {
  palette:palette, 
  min: 1, 
  max: 5
},"merged clusters",false);

/**=========================================================================
* SMOOTHING USING A CONVOLUTION
* ====================================================================== */

var SCALE = 10;

// Smooth with a mode filter.
// and force operations to be done at native scale
var mode = remapped.focal_mode().reproject('EPSG:4326', null, SCALE);

// Weighted smoothing 
// using a 3x3 window
// euclidean distance weighting from corners
var weights = [[1,2,1],
               [2,3,2],
               [1,2,1]];

// create a 3x3 kernel with the weights
// kernel W and H must equal weight H and H
var kernel = ee.Kernel.fixed(3,3,weights);

// apply mode on neightborhood using weights
// and force operations to be done at native scale
var weighted_mode = remapped.reduceNeighborhood({
  reducer: ee.Reducer.mode(),
  kernel: kernel
}).reproject('EPSG:4326', null, SCALE);

var weighted_mode = weighted_mode.reduceNeighborhood({
  reducer: ee.Reducer.mode(),
  kernel: kernel
}).reproject('EPSG:4326', null, SCALE);

// Morphological Filters
var mophofilters = remapped.focal_mode().focal_max(3).focal_min(5).focal_max(3).reproject('EPSG:4326', null, SCALE);


Map.addLayer(mode.clip(table), {
  palette:palette, 
  min: 1, 
  max: 5
},"mode",false);

Map.addLayer(weighted_mode.clip(table), {
  palette:palette, 
  min: 1, 
  max: 5
},"weigthed mode",false);

Map.addLayer(mophofilters.clip(table), {
  palette:palette, 
  min: 1, 
  max: 5
},"morphological filters",false);

var image_majority = geet.majority(remapped, 3);

Map.addLayer(image_majority.clip(table), {
  palette:palette, 
  min: 1, 
  max: 5
},"majority geet",false);

/**=========================================================================
* ADD BOUNDARY LAYER FOR VISUALIZATION
* ====================================================================== */

// Add Layer of Iloilo BOundary
Map.addLayer(ee.Image().paint(table, 0, 2), {palette:['red']}, "Iloilo Province", false);
// Map.centerObject(clusterResult, 9);
Map.setOptions('HYBRID')

/**=========================================================================
* EXPORT LAYERS
* ====================================================================== */

Export.image.toDrive({
  image: weighted_mode, 
  description: 'weighted_mode_Iloilo_v001', 
  region: exportGeometry, 
  scale: 10, 
  maxPixels: 1e13, 
  fileFormat: 'GeoTIFF', 
});