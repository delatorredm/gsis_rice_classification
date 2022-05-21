/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var table = ee.FeatureCollection("users/ddel528/ph3adm_iloilo_dissolved"),
    clusterResult = ee.Image("users/ddel528/cluster_initial_v03"),
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
          [122.41285914233686, 11.440743530010431]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.addLayer(clusterResult.randomVisualizer(), null, 'cluster result', false,0.8)
print(clusterResult)
/**=========================================================================
* REMAP CLASSES
* ====================================================================== */
// merge several clusters together

  // Define your from and to values
  var fromForest =  ee.List([3,7,29,30,31,33,35,37,48,49,47,10]); // original values
  var toForest =    ee.List([1,1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]); // values to give to the pixels

  var fromBuildup = ee.List([2,6,12,13,19,20,21,23,27,32,38,42]); // original values
  var toBuildup =   ee.List([2,2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]); // values to give to the pixels


  var fromRainfed = ee.List([0,1,4,5,8,9,11,14,16,22,25,34,40,45,43,39]); // original values
  var toRainfed =   ee.List([3,3,3,3,3,3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]);         // values to give to the pixels

  var fromIrrigated = ee.List([15,17,18,24,26,28,36,41,44,46]);
  var toIrrigated =   ee.List([ 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);

  // concatenate the lists
  var fromList = fromForest.cat(fromBuildup).cat(fromRainfed).cat(fromIrrigated);
  var toList = toForest.cat(toBuildup).cat(toRainfed).cat(toIrrigated);
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
  '387242', // forest
  'CC0013', // urban
  'CDB33B', // rainfed
  '62ffcc', // irrigated
  ];
Map.addLayer(remapped.clip(table), {
  palette:palette, 
  min: 1, 
  max: 4
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

Map.addLayer(mode.clip(table), {
  palette:palette, 
  min: 1, 
  max: 4
},"mode",false);

Map.addLayer(weighted_mode.clip(table), {
  palette:palette, 
  min: 1, 
  max: 4
},"weigthed mode",false);


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
  description: 'weighted_mode_Oton', 
  region: exportGeometry, 
  scale: 10, 
  maxPixels: 1e13, 
  fileFormat: 'GeoTIFF', 
});