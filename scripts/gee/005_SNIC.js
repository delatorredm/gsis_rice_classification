/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var image = ee.Image("users/ddel528/imageStats_decadal_annual_2019"),
    table = ee.FeatureCollection("users/ddel528/ph3adm_iloilo_dissolved");
/***** End of imports. If edited, may not auto-convert in the playground. *****/

// Create a uniformly spaced seed grid.
var seeds = ee.Algorithms.Image.Segmentation.seedGrid(15, 'square');
print(seeds)
Map.addLayer(seeds, {palette:['red']}, 'seeds', false);
// Prepare SNIC
// var kernel = ee.Kernel.gaussian(3);
// image = image.convolve(kernel);


var snic = ee.Algorithms.Image.Segmentation.SNIC({
  image: image,
  size: 15,
  compactness: 1,
  // neighborhoodSize: 256,
  connectivity: 4,
  seeds: seeds
});

print('snic result', snic);

// Pull out the clusters layer, each cluster has a uniform value.
var clusters = snic.select('clusters');
Map.addLayer(clusters.randomVisualizer(), {}, 'Clusters', false);

// Visualize the cluster means.
var clusterVis = {bands: ['GCVI_mean_mean'], min: 0, max: 2, palette:['red','yellow','green'],};
Map.addLayer(snic, clusterVis, 'Cluster means', true, 1);

// Compute the standard deviation of each cluster.
var stdDev = image.addBands(clusters).reduceConnectedComponents({
  reducer: ee.Reducer.stdDev(),
  labelBand: 'clusters',
  maxSize: 256
});
Map.addLayer(stdDev, {}, 'Std dev', false);



// Add Layer of Iloilo BOundary and centering
Map.addLayer(ee.Image().paint(table, 0, 2), {palette:['red']}, "Iloilo Province");
Map.centerObject(image, 9);
