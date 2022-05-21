 
/**************************************************************************
 * Purpose: Threshold-based masking using vegetation Indices
 * Author: Daniel dela Torre
 * Date: 15 April 2020
 *************************************************************************/ 

/**=========================================================================
 * SPECTRAL INDICES FUNCTIONS
 * ====================================================================== */
 
/** Equation for GCVI (Gitelson, 2005)
 * @param   {ee.Image} Sentinel-2 image
 * @return  {ee.Image} Sentinel-2 image with additional GCVI band
 */
function gcvi(image) {
  var vi = image.expression(
    'GCVI = (NIR / GREEN) - 1', {
      'NIR':   image.select('B8'),
      'GREEN': image.select('B3'),
    });
    return image.addBands(vi).copyProperties(image, ['system:time_start']);
}

/** Equation for LSWI (Jürgens, 1997; Xiao, 2002, 2004)
 * @param   {ee.Image} Sentinel-2 image
 * @return  {ee.Image} Sentinel-2 image with additional LSWI band
 */
function lswi(image) {
  var vi = image.normalizedDifference(['B8','B11']).rename('LSWI');
  return image.addBands(vi).copyProperties(image, ['system:time_start']);
}

/** Equation for NDVI (Tucker, 1979)
 * @param   {ee.Image} Sentinel-2 image
 * @return  {ee.Image} Sentinel-2 image with additional NDVI band
 */
function ndvi(image){
  var vi = image.normalizedDifference(['B8','B4']).rename('NDVI');
  return image.addBands(vi).copyProperties(image, ['system:time_start']);
}
/*=========================================================================
                OTHER HELPER FUNCTIONS
 *====================================================================== */
 
/**
 * Function to mask clouds using the Sentinel-2 QA band
 * @param {ee.Image} image Sentinel-2 image
 * @return {ee.Image} cloud masked Sentinel-2 image
 */
function maskS2clouds(image) {
  var qa = image.select('QA60');

  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return image.updateMask(mask).copyProperties(image, ['system:time_start']);
}
 
/**
 * Function to aggregate into n-day composites
 */

function getWeeklySentinelComposite(date) {
  
  var sentinel2 = ee.ImageCollection('COPERNICUS/S2') // Select the Data Collection
                      .filterBounds(geogBounds) // Set the geographical bounds for filtering
                      .filterDate(date, date.advance(daysToAdvance, 'day')) // select days to advance
                      .map(maskS2clouds); // Apply cloud mask to each image
                      
  // Function  to map gcvi and cloud masking
  var vi = sentinel2.map(gcvi).map(lswi).map(ndvi);
  
  // Select the max
  var composite = vi.select(['GCVI','LSWI','NDVI']).max()
                      .set(   // Set some properties info...
                        'system:time_start', date.millis(), 
                        'dateYMD', date.format('YYYY-MM-dd'), 
                        'numbImages', sentinel2.size());
  return composite;
}

// GEOGRAPHICAL EXTENT
var phl_adm3 = ee.FeatureCollection("users/ddel528/phl_admbnda_adm3_psa_namria_20180130");
var geogBounds = phl_adm3.filter(ee.Filter.eq('ADM3_EN', 'Oton'));
//----------------------------------------------------------------------- */

/**=========================================================================
 * USER INPUTS MASKS
 * ====================================================================== */

var startDate   =   '2019-01-01';
var endDate     =   '2019-12-31';
var daysToAdvance = 10;

//==== END OF USER INPUTS =============================================== */

// Generate list of weeks/days to iterate over
var weekDifference = ee.Date(startDate).advance(daysToAdvance, 'day').millis().subtract(ee.Date(startDate).millis());
var listMap = ee.List.sequence(ee.Date(startDate).millis(), ee.Date(endDate).millis(), weekDifference);

// Create ImageCollection from images from listMap
var sentinel2_IC = ee.ImageCollection.fromImages(listMap.map(function(dateMillis){
  var date = ee.Date(dateMillis);
  return getWeeklySentinelComposite(date);
}));
print('Sentinel2-IC',sentinel2_IC);
Map.addLayer(sentinel2_IC.filter(ee.Filter.eq('system:index','10')), {
  bands:['NDVI'],
  palette:['red','yellow','green']}, 'indexTest',
  false);

var gcvi_IC = sentinel2_IC.select('GCVI');

// Simple averaging thresholds using GCVI values
var urban = gcvi_IC.mean().gte(0.5).or(gcvi_IC.median().gte(0.42));
var forest = gcvi_IC.mean().lte(1.55).or(gcvi_IC.median().lte(1.55));

/**=========================================================================
 * ANCILLARY MASKS
 * ====================================================================== */

/**
 * SRTM (Elevation and Slope)
 */
 
// Load the SRTM image.
var srtm = ee.Image("CGIAR/SRTM90_V4");

// Apply slope algorithm to SRTM image
var slope = ee.Terrain.slope(srtm);

// Simple averaging thresholds using elevation and slope values
var slopeMask = slope.lte(3); // slope less than 2 deg
var elevationMask = srtm.lte(1000); // elevation less than 1500 masl

/**=========================================================================
 * APPLY ALL MASKS
 * ====================================================================== */

// Apply the masking method to all images of sentinel2_IC
var maskedS2IC = sentinel2_IC.map(function(image){
  return image.updateMask(urban)
    .updateMask(forest)
    .updateMask(slopeMask)
    .updateMask(elevationMask);
});

/**=========================================================================
 * VISUALIZER
 * ====================================================================== */

// Center on Object
// Map.centerObject(geogBounds,9); // Whole of Iloilo
Map.centerObject(geogBounds,13); // Municipality only
// Select a HYBRID satellite/road basemap
Map.setOptions('HYBRID');

// maskedS2IC = maskedS2IC.filter(ee.Filter.calendarRange(1,8,'month')); // Selecting for August Imagery
print('Masked Sentinel-2 ImageCollection',maskedS2IC);
Map.addLayer(maskedS2IC.median(),{ // Select the median image to visualize.
      bands: ['NDVI'], // Select only one band to visualize
      palette:['red','yellow','green']
    },'median of maskedS2IC', 
    false);

/**=========================================================================
 * TEMPORAL COMPOSITE
 * ====================================================================== */

// Create a statistics composite for maskedS2IC
var combinedReducer = ee.Reducer.mean().combine({   // mean
  reducer2: ee.Reducer.median(),                    // median
  sharedInputs: true
}).combine({                                        // combine
  reducer2: ee.Reducer.stdDev(),                    // stdDev
  sharedInputs: true
});

// Function to clip to only geogBounds
var maskedS2IC_clip = maskedS2IC.map(function(image) {
  return image.clip(geogBounds);
});

// Apply reducer to all images in imageCollection
var stats = maskedS2IC_clip.reduce({
  reducer: combinedReducer,
});

print(stats);

Map.addLayer(stats.select('GCVI_stdDev'),{ // Select the median image to visualize.
      palette:['red','yellow','green']
    },'maskedS2IC_clip',
    false);

/**=========================================================================
 * UNSUPERVISED CLASSIFIER
 * ====================================================================== */

// Display the sample region.
Map.addLayer(ee.Image().paint(geogBounds, 0, 2), {palette:'red'}, 'region', false);

// Make the training dataset.
var training = stats.sample({
  region: geogBounds,
  scale: 10,
  numPixels: 250
});

// Instantiate the clusterer and train it.
var clusterer = ee.Clusterer.wekaKMeans(10).train(training);

// Cluster the input using the trained clusterer.
var result = stats.cluster(clusterer);
print('class results',result);
// Display the clusters with random colors.
Map.addLayer(result.randomVisualizer(), {}, 'clusters', false);

/**=========================================================================
 * VISUALIZE CLASSIFIER RESULT
 * ====================================================================== */

// Select one cluster
var oneCluster = result.select("cluster").eq(8).selfMask();

// Visualize single cluster on map
Map.addLayer(oneCluster,{palette:['chartreuse']},"only 2", true);

/**=========================================================================
 * EXPORT CLASSIFIER RESULT
 * ====================================================================== */
/*
Export.image.toDrive({image: result, 
  description: 'myExportImageTask', 
  //folder, 
  // fileNamePrefix, 
  //dimensions, 
  region: geogBounds, 
  scale: 10, 
  // crs, 
  // crsTransform, 
  maxPixels: 1e9, 
  // shardSize, 
  // fileDimensions, 
  // skipEmptyTiles, 
  fileFormat: 'GeoTIFF', 
  // formatOptions
});

/**/