/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([122.5297693459299, 10.703690239471257]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/

/**************************************************************************
 * Purpose: Threshold-based masking using vegetation Indices
 * Author: Daniel dela Torre
 * Date: 15 April 2020
 *************************************************************************/

/**=========================================================================
 * SPECTRAL INDICES FUNCTIONS
 * =========================================================================
 */
 
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
 *========================================================================= 
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
  var sentinel2 = ee.ImageCollection('COPERNICUS/S2')
                      .filterBounds(geogBounds)
                      .filterDate(date, date.advance(daysToAdvance, 'day'));

  // Function  to map gcvi and cloud masking
  var vi = sentinel2.map(maskS2clouds).map(gcvi);
  
  // Select the max
  var composite = vi.select('GCVI').max()
                      .set(
                        'system:time_start', date.millis(), 
                        'dateYMD', date.format('YYYY-MM-dd'), 
                        'numbImages', sentinel2.size());
  return composite;
}

// GEOGRAPHICAL EXTENT
var phl_adm3 = ee.FeatureCollection("users/ddel528/phl_admbnda_adm3_psa_namria_20180130");
var geogBounds = phl_adm3.filter(ee.Filter.eq('ADM3_EN', 'San Joaquin'));
//--------------------------------------------------------------------------

/**=========================================================================
 * USER INPUTS MASKS
 * =========================================================================
 */

var startDate   =   '2019-01-01';
var endDate     =   '2019-12-31';
var daysToAdvance = 10;

//==== END OF USER INPUTS ==================================================

// Generate list of weeks/days to iterate over
var weekDifference = ee.Date(startDate).advance(daysToAdvance, 'day').millis().subtract(ee.Date(startDate).millis());
var listMap = ee.List.sequence(ee.Date(startDate).millis(), ee.Date(endDate).millis(), weekDifference);

// Create ImageCollection from images from listMap
var sentinel2_IC = ee.ImageCollection.fromImages(listMap.map(function(dateMillis){
  var date = ee.Date(dateMillis);
  return getWeeklySentinelComposite(date);
}));

// Redistribute calculating reducers
var gcviStats = sentinel2_IC.mean()
  .reduceRegion({
    reducer: 'mean',
    geometry: geogBounds,
    scale: 10,
    bestEffort: true,
  });

// Simple averaging thresholds using GCVI values
var waterurban = sentinel2_IC.mean().gte(0.5).or(sentinel2_IC.median().gte(0.42));
var forest = sentinel2_IC.mean().lte(1.55).or(sentinel2_IC.median().lte(1.55));
//var gcviMedian = sentinel2_IC.median();
//var gcviMean = sentinel2_IC.mean();
//var gcviSD = sentinel2_IC.reduce(ee.Reducer.stdDev());

/**=========================================================================
 * ANCILLARY MASKS
 * =========================================================================

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

// Apply the masking method to all images of sentinel2_IC
var maskedS2IC = sentinel2_IC.map(function(image){
  return image.updateMask(waterurban)
    .updateMask(forest)
    .updateMask(slopeMask)
    .updateMask(elevationMask);
});

/**=========================================================================
 * VISUALIZER
 * =========================================================================
 */
// Center on Object
Map.centerObject(geogBounds,9); // Whole of Iloilo
// Map.centerObject(geogBounds,14); // Municipality only
// Select a HYBRID satellite/road basemap
Map.setOptions('HYBRID');

// maskedS2IC = maskedS2IC.filter(ee.Filter.calendarRange(1,8,'month')); // Selecting for August Imagery
print('Masked Sentinel-2 ImageCollection',maskedS2IC);
Map.addLayer(maskedS2IC.median(),{ // Select the median image to visualize.
      palette:['red','yellow','green']
    },'median of maskedS2IC',true);
