/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = 
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
 
/** Eqpuation for LSWI (Jürgens, 1997; Xiao, 2002, 2004)
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
var phl_adm3 = ee.FeatureCollection("users/ddel528/phl3adm_iloilo_dissolved");

var geogBounds = geometry.buffer(10000)
//----------------------------------------------------------------------- */

/**=========================================================================
 * USER INPUTS MASKS
 * ====================================================================== */

var startDate   =   '2019-01-01';
var endDate     =   '2020-01-01';
var daysToAdvance = 10;

var outFilename = 'imageStats3/imageStats3_decadal_dry_2019';

//==== END OF USER INPUTS =============================================== */

// Generate list of weeks/days to iterate over
var weekDifference = ee.Date(startDate).advance(daysToAdvance, 'day').millis().subtract(ee.Date(startDate).millis());
var listMap = ee.List.sequence(ee.Date(startDate).millis(), ee.Date(endDate).millis(), weekDifference);

// Create ImageCollection from images from listMap
var sentinel2_IC = ee.ImageCollection.fromImages(listMap.map(function(dateMillis){
  var date = ee.Date(dateMillis);
  return getWeeklySentinelComposite(date);
}));
// print('Sentinel2-IC',sentinel2_IC);

// Visualize
Map.addLayer(sentinel2_IC.filter(ee.Filter.eq('system:index','10')), {
  bands:['NDVI'],
  palette:['red','yellow','green']}, 'indexTest',
  false);

/**=========================================================================
 * ANCILLARY MASKS
 * ====================================================================== */

/**
 * SRTM (Elevation and Slope)
 */
/* 
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
/*
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
Map.centerObject(geogBounds,9); // Municipality only
// Select a HYBRID satellite/road basemap
Map.setOptions('HYBRID');
/*
// maskedS2IC = maskedS2IC.filter(ee.Filter.calendarRange(1,8,'month')); // Selecting for August Imagery
print('Masked Sentinel-2 ImageCollection',maskedS2IC);
Map.addLayer(maskedS2IC.median(),{ // Select the median image to visualize.
      bands: ['NDVI'], // Select only one band to visualize
      palette:['red','yellow','green']
    },'median of maskedS2IC', 
    false);

/**=========================================================================
 * IMPORT SAMPLE POINTS
 * ====================================================================== */

/* CHANGE THIS ================================= */
var class_num = '00'; // 

var VISelected = ['GCVI','LSWI','NDVI']; // which VI
/**/

//class_num = class_num.getInfo();
var inName = ee.String('users/ddel528/timeSeriesSamples_03');


// print(inName.getInfo());

var sample = ee.FeatureCollection(inName.getInfo());

// print('sample',sample);

Map.addLayer(sample, {color:'red'}, 'clusterSamples');
/**=========================================================================
* EXTRACT AVERAGE TIME-SERIES FOR THE CLASS
* ====================================================================== */

// var export_TS_extract = sentinel2_IC.select(VISelected).map(function(img) {
//   return img.reduceRegions({
//     collection: sample, 
//     reducer:ee.Reducer.mean(),
//     scale: 10
//   }).copyProperties(img, ['dateYMD','numbImages','system:time_start']);
// });

// // Flatten the FeatureCollection
// export_TS_extract = export_TS_extract.flatten();
// // print('exportTSextractFirst', export_TS_extract.first());

// // Designate Filte name for output file
// var outName = ee.String('cluster_timeseries_');
// outName = outName.cat(ee.String(class_num));
// print(outName.getInfo());

// // Export
// Export.table.toDrive({
//   collection: export_TS_extract, 
//   description: outName.getInfo(), 
//   folder: 'cluster_charts2'
// });


// Create a time series chart.


// var plotVI = ui.Chart.image.seriesByRegion({
//   imageCollection: sentinel2_IC,
//   regions: sample.filter(ee.Filter.eq('cluster', ee.Number.parse(class_num))),
//   reducer: ee.Reducer.mean(),
//   band: VISelected,
//   scale: 10,
//   seriesProperty: 'dateYMD'
// });

// var chartTitleString = ee.String('GCVI short-term time series. Cluster: ').cat(ee.String(class_num)).getInfo();

// plotVI.setChartType('ScatterChart');
// plotVI.setOptions({
//   title: chartTitleString,
//   hAxis: {title: 'Date'},
//   vAxis: {title: 'VIs'}
// });

// // Display.
// print(plotVI);

/**=========================================================================
 * IMPORT SAMPLE POINTS
 * ====================================================================== */

var clusterList = [];

/********    CHANGE THIS SECTION TO MATCH CLUSTER OF INTEREST   ***********/
for(var i = 0; i < 50; i++) {clusterList.push(i)}
/********                           END                         ***********/

print(clusterList);

/**=========================================================================
 * ITERATE FOR EACH ELEMENT OF CLUSTER
 * ====================================================================== */
clusterList.forEach(function(class_num) {
  print(class_num)
  class_num = ee.Number(class_num);
  
  // var inName = ee.String('users/ddel528/timeSeriesSamples_03');
  // inName = inName.cat(ee.String(class_num));
  // print(inName.getInfo());
  
  // var sample = ee.FeatureCollection(inName.getInfo());
  
  // print('sample',sample);
  // Map.addLayer(sample, {color:'red'}, 'sample');
  
  /**=========================================================================
  * EXTRACT AVERAGE TIME-SERIES FOR THE CLASS
  * ====================================================================== */
  
  var tableWithStats = sentinel2_IC.map(function(im) {
    var date = ee.Number.parse(im.get("system:time_start"))
    var res = im.reduceRegions({
    collection: sample.filter(ee.Filter.eq('cluster', ee.Number.parse(class_num))),
    reducer: ee.Reducer.mean(),
    scale: 10
  }).map(function(ft){
    return ft.set("date", date)
  })
    return res
  }).flatten()
    // .filterMetadata("mean", "not_equals", null) // drop null values (dont use)
    .select([".*"], null, false)
  
  print('first 10 entries', tableWithStats.limit(10)) // view first 10 entries
  
  // Designate File name for output file
  var outName = ee.String('cluster_timeseries_');
  outName = outName.cat(ee.String(class_num));
  
  // Export
  Export.table.toDrive({
    collection: tableWithStats, 
    description: outName.getInfo(), 
    folder: 'cluster_charts3',
    selectors: ['system:index','GCVI','LSWI','NDVI']});

});



/**/