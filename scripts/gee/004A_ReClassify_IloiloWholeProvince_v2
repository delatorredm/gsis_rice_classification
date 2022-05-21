/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var table = ee.FeatureCollection("users/ddel528/ph3adm_iloilo_dissolved"),
    clusterResult = ee.Image("users/ddel528/cluster_initial_v03");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.addLayer(clusterResult.randomVisualizer(), null, 'cluster result', false,.8)
print(clusterResult)
/**=========================================================================
* REMAP CLASSES
* ====================================================================== */
// merge several clusters together

  // Define your from and to values
  var fromForest = [3	,7	,29	,30	,31	,33	,35	,37	,48	,49, 47, 10]; // original values
  var toForest = [1,1,1,1,1,1,1,1,1,1,1,1]; // values to give to the pixels

  var fromAgricultural = [0,1,4,5,8,9,11,14,15,16,17,18,22,24,25,26,28,34,36,40,41,44,45,46,43,39]; // original values
  var toAgricultural =   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];         // values to give to the pixels

  var fromBuildup = [2,6,12,13,19,20,21,23,27,32,38,42]; // original values
  var toBuildup = [1,1,1,1,1,1,1,1,1,1,1,1]; // values to give to the pixels

  // remap the pixel values and rename the bands accordingly
  var Forest = clusterResult.remap(fromForest, toForest, 0, 'cluster').rename('Forest');
  var Agricultural = clusterResult.remap(fromAgricultural, toAgricultural, 0, 'cluster').rename('Agricultural');
  var Buildup = clusterResult.remap(fromBuildup, toBuildup, 0, 'cluster').rename('Buildup');

  // concatenate to one image
  var image = ee.Image.cat([Buildup, Agricultural, Forest]);

  
/**=========================================================================
* VISUALIZE CLASSIFIER RESULT
* ====================================================================== */

Map.addLayer(image.clip(table),{},"merged clusters",false);

// Select one cluster
var oneCluster = clusterResult.select('cluster').eq(46).selfMask();

// Visualize single cluster on map
Map.addLayer(oneCluster,{palette:['yellow']},"Class Being Investigated", true);

// Add Layer of Iloilo BOundary
Map.addLayer(ee.Image().paint(table, 0, 2), {palette:['red']}, "Iloilo Province");
// Map.centerObject(clusterResult, 9);
Map.setOptions('HYBRID')
