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

/*=========================================================================
                GEOGRAPHICAL EXTENT
 *====================================================================== */

//  Iloilo
var phl_adm3 = ee.FeatureCollection("users/ddel528/phl_admbnda_adm3_psa_namria_20180130");

// var geogBounds = phl_adm3.filter(ee.Filter.eq('ADM3_EN', 'Oton'));

var geogBounds = geometry.buffer(10000)
Map.addLayer(geogBounds, null,'geogBounds')
//----------------------------------------------------------------------- */

/*=========================================================================
                USER INPUTS MASKS
 *====================================================================== */

// // For Dry Season
// var startDate   =   '2018-10-01';
// var endDate     =   '2019-04-01';

// var outFilename = 'imageStats4_decadal_dry_2019';


// // For Wet Season
// var startDate   =   '2019-04-01';
// var endDate     =   '2019-10-01';

// var outFilename = 'imageStats4_decadal_wet_2019';

// Start Date
var startDate = '2018-10-01';

// End Date
var endDate = '2019-10-01';

var outFilename = 'imageStats4_decadal_annual_2019';

/*=========================================================================
                PROCESS IMAGE COLLECTION
 *====================================================================== */

// Create image collection of S-2 imagery for the period specified above
var s2 = ee.ImageCollection('COPERNICUS/S2')
  .filterDate(startDate, endDate) //filter start and end date
  .filterBounds(geogBounds);      //filter according to drawn boundary

// Apply cloud mask and add NDVI to ImageCollection
var s2 = s2.map(maskS2clouds).map(gcvi).map(lswi);

var interval = 1;
var months_list = ee.List.sequence(1, 12, interval);
var year_list = ee.List.sequence(2018, 2019); 

// Group by month, and then reduce within groups by mean();
// the result is an ImageCollection with one image for each
// month.
var byMonth = ee.ImageCollection.fromImages(
  year_list.map(function (ynz) {
    return months_list.map(function(mnz){
      var w = s2.filter(ee.Filter.calendarRange(ynz, ynz, 'year'))
                .filter(ee.Filter.calendarRange(mnz, ee.Number(mnz).add(interval), 'month'))
                .select(['GCVI','LSWI'])
                .max();
      return w.set('year', ynz)
              .set('month', mnz)
              .set('date', ee.Date.fromYMD(ynz,mnz,1))
              .set('system:time_start',ee.Date.fromYMD(ynz,mnz,1).millis())
              .set('ID',ee.Date.fromYMD(ynz,mnz,1));
    });
  }).flatten());

// Subset to Study dates
byMonth = byMonth.filterDate(startDate, endDate);

// Check byMonth variable
print('byMonth properties', byMonth);

// Convert to output image format and rename for compatibility
var output_image = byMonth.toBands();
output_image = output_image.regexpRename('^(.*)', 'b$1'); // Rename to be able to export
print('output_image properties', output_image);


/*=========================================================================
                VISUALIZE SCRIPT
 *====================================================================== */

Map.addLayer(output_image.select('b9_GCVI'), {
  palette:['red','yellow','green']}, 'testOutput',
  true);


/*=========================================================================
                EXPORT SCRIPT
 *====================================================================== */

Export.image.toAsset({
  image: output_image, 
  description: outFilename, 
  assetId: 'imageStats4/' + outFilename,
  region: geogBounds, 
  scale: 10,
  maxPixels: 1e10});

