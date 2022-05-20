/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var table = ee.FeatureCollection("users/ddel528/ph3adm_iloilo_dissolved"),
    clusterResult = ee.Image("users/ddel528/cluster_initial_v03");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.addLayer(clusterResult.randomVisualizer(), null, 'cluster result', false)
print(clusterResult)
// /**=========================================================================
// * REMAP CLASSES
// * ====================================================================== */

// var remapped = clusterResult.remap([0,1,2,3,4,5,6,7,8,9],[0,0,1,1,0,1,1,1,1,0]);
// Map.addLayer(remapped.randomVisualizer(), {}, 'remapped', false);

// /**=========================================================================
// * VISUALIZE CLASSIFIER RESULT
// * ====================================================================== */

// // Select one cluster
// var oneCluster = remapped.select("remapped").eq(1).selfMask();

// // Visualize single cluster on map
// Map.addLayer(oneCluster,{palette:['36b44b']},"rice Only", true);

// // Add Layer of Iloilo BOundary
// Map.addLayer(ee.Image().paint(table, 0, 2), {palette:['red']}, "Iloilo Province");
// // Map.centerObject(clusterResult, 9);
// Map.setOptions('HYBRID')
