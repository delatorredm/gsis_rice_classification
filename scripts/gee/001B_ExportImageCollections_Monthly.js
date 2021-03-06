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
 
/** Equation for LSWI (J??rgens, 1997; Xiao, 2002, 2004)
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
  var vi = sentinel2.map(gcvi).map(lswi);
  
  // Select the max
  // var composite = vi.select(['GCVI','LSWI','NDVI']).max()
  var composite = vi.select(['GCVI','LSWI']).max()
                      .set(   // Set some properties info...
                        'system:time_start', date.millis(), 
                        'dateYMD', date.format('YYYY-MM-dd'), 
                        'numbImages', sentinel2.size());
  return composite;
}

// GEOGRAPHICAL EXTENT
var phl_adm3 = ee.FeatureCollection("users/ddel528/phl_admbnda_adm3_psa_namria_20180130");
// var geogBounds = phl_adm3.filter(ee.Filter.eq('ADM3_EN', 'Oton'));
var geogBounds = geometry.buffer(10000)
Map.addLayer(geogBounds, null,'geogBounds')
//----------------------------------------------------------------------- */

/**=========================================================================
 * USER INPUTS MASKS
 * ====================================================================== */

// // For Dry Season
// var startDate   =   '2018-10-01';
// var endDate     =   '2019-04-01';

// var outFilename = 'imageStats4_decadal_dry_2019';


// // For Wet Season
// var startDate   =   '2019-04-01';
// var endDate     =   '2019-10-01';

// var outFilename = 'imageStats4_decadal_wet_2019';

// For Annual 
var startDate   =   '2018-10-01';
var endDate     =   '2019-10-01';

var outFilename = 'imageStats4_decadal_annual_2019';


//====//
var daysToAdvance = 10;

//==== END OF USER INPUTS =============================================== */

// Generate list of weeks/days to iterate over
var weekDifference = ee.Date(startDate).advance(daysToAdvance, 'day').millis().subtract(ee.Date(startDate).millis());
var weekDifference = ee.Date(startDate).advance(daysToAdvance, 'month').millis().subtract(ee.Date(startDate).millis());

var listMap = ee.List.sequence(ee.Date(startDate).millis(), ee.Date(endDate).millis(), weekDifference);

// Create ImageCollection from images from listMap
var sentinel2_IC = ee.ImageCollection.fromImages(listMap.map(function(dateMillis){
  var date = ee.Date(dateMillis);
  return getWeeklySentinelComposite(date);
}));
print('Sentinel2-IC',sentinel2_IC);

Map.addLayer(sentinel2_IC.filter(ee.Filter.eq('system:index','10')), {
  bands:['GCVI'],
  palette:['red','yellow','green']}, 'indexTest',
  false);





// Simple averaging thresholds using GCVI values
var gcvi_IC = sentinel2_IC.select('GCVI');
var urban = gcvi_IC.mean().gte(0.5).or(gcvi_IC.median().gte(0.42));
var forest = gcvi_IC.mean().lte(1.55).or(gcvi_IC.median().lte(1.55));

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
 * TEMPORAL COMPOSITE
 * ====================================================================== */

// Create a statistics composite for maskedS2IC
var combinedReducer = ee.Reducer.mean().combine({   // mean
  reducer2: ee.Reducer.median(),                    // median
  sharedInputs: true
}).combine({                                        // combine
  reducer2: ee.Reducer.stdDev(),                    // stdDev
  sharedInputs: true
}).combine({
  reducer2: ee.Reducer.percentile([5, 25, 50, 75, 95]),
  sharedInputs: true
});

// Function to clip to only geogBounds
var maskedS2IC_clip = sentinel2_IC.map(function(image) {
  return image.clip(geogBounds);
});

// Apply reducer to all images in imageCollection
var stats = maskedS2IC_clip.reduce({
  reducer: combinedReducer,
});

print('stats',stats);

Map.addLayer(stats.select('GCVI_median'),{ // Select the median image to visualize.
      palette:['red','yellow','green']
    },'stats',
    false);

/**=========================================================================
 * SELECT WHAT DATASET TO EXPORT
 * ====================================================================== */

var output_img = maskedS2IC_clip.toBands(); // Clipped masked S2IC convert to bands
// stats = stats; // Clipped masked S2IC

output_img = output_img.regexpRename('^(.*)', 'b$1'); // Rename to be able to export

print('Output Image Properties', output_img);
Map.addLayer(output_img.select('b0_LSWI'), {
  palette:['red','yellow','green']}, 'testOutput',
  true);

/**=========================================================================
 * EXPORT COMPOSITE
 * ====================================================================== */
Export.image.toAsset({
  image: output_img, 
  description: outFilename, 
  assetId: 'imageStats4/' + outFilename,
  region: geogBounds, 
  scale: 10,
  maxPixels: 1e10});

// /**=========================================================================
// * FOR MONTHLY COMPOSITE:
// * ====================================================================== */


// // Apply cloud mask and add NDVI to ImageCollection
// var s2 = s2.map(maskS2clouds).map(viExpression);

// var interval = 1;
// var months_list = ee.List.sequence(1, 12, interval);
// var year_list = ee.List.sequence(2018, 2019); 

// // Group by month, and then reduce within groups by mean();
// // the result is an ImageCollection with one image for each
// // month.
// var byMonth = ee.ImageCollection.fromImages(
//   year_list.map(function (ynz) {
//     return months_list.map(function(mnz){
//       var w = s2.filter(ee.Filter.calendarRange(ynz, ynz, 'year'))
//                 .filter(ee.Filter.calendarRange(mnz, ee.Number(mnz).add(interval), 'month'))
//                 .select('BVI').max();
//       return w.set('year', ynz)
//               .set('month', mnz)
//               .set('date', ee.Date.fromYMD(ynz,mnz,1))
//               .set('system:time_start',ee.Date.fromYMD(ynz,mnz,1).millis())
//               .set('ID',ee.Date.fromYMD(ynz,mnz,1));
//     });
//   }).flatten());

// print(byMonth.filterDate(startDate, endDate));



/**/