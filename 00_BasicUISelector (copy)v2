/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geogBounds = ee.FeatureCollection("users/ddel528/iloilo_only_shp"),
    geometry = /* color: #d63000 */ee.Geometry.Point([122.54814859668261, 10.729554491195232]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Purpose: Process Sentinel-2 Imagery and Plot Time Series for Farm Points
// Author: Daniel dela Torre
// Date: 01 Feb 2020

//-------------------------------------------------------------------------------

// **Use an expression to add VI band
var viExpression = function(image) {
  var vi = image.expression(
    // 'BVI = NIR / RED', {                                                          // RVI
    // 'BVI = 2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {             // EVI
    // 'BVI = (NIR - RED) / (NIR + RED)', {                                          // NDVI
    // 'BVI = (NIR - GREEN) / (NIR + GREEN)', {                                      // GNDVI
    // 'BVI = ((NIR - RED) / (NIR + RED + 0.5)) * (1 + 0.5)', {                      // SAVI
    // 'BVI = (1 + 0.16) * ((NIR - RED) / (NIR + RED + 0.16))', {                    // OSAVI
    // 'BVI = (2 * NIR + 1 - sqrt(pow((2 * NIR + 1), 2) - 8 * (NIR - RED)) ) / 2', { // MSAVI
    //'BVI = (1.5 * (1.2 * (NIR - GREEN) - 2.5 * (RED - GREEN))) / (sqrt((pow((2 * NIR + 1), 2) - (6 * NIR - 5 * sqrt(RED)) - 0.5)))', { // MTVI2
    'VI = (NIR / GREEN) - 1', {                                                  // GCVI
    // 'BVI = (REDEDGE - RED) / (REDEDGE + RED)', {                                          // reNDVI
    // 'BVI = (NIR2 - SWIR) / (NIR2 + SWIR)', {    // LSWI
      'NIR':   image.select('B8'),
      'NIR2':   image.select('B8A'),
      'BLUE':  image.select('B2'),
      'GREEN': image.select('B3'),
      'RED':   image.select('B4'),
      'REDEDGE': image.select('B5'), 
      'SWIR' : image.select('B11')
    });
    return image.addBands(vi).copyProperties(image, ['system:time_start']);
};
//-------------------------------------------------------------------------------

// Start Date
var startDate = '2018-10-01';

// End Date
var endDate = '2019-10-01';

// Create image collection of S-2 imagery for the period specified above
var s2 = ee.ImageCollection('COPERNICUS/S2')
  .filterDate(startDate, endDate) //filter start and end date
  .filterBounds(geogBounds);      //filter according to drawn boundary

// Function to mask cloud from built-in quality band information on cloud
function maskS2clouds(image) {
  var qa = image.select('QA60');

  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return image.updateMask(mask).divide(10000).copyProperties(image, ['system:time_start']);
}


// Apply cloud mask and add NDVI to ImageCollection
var s2 = s2.map(maskS2clouds).map(viExpression);

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
                .select('VI')
                .max();
      return w.set('year', ynz)
              .set('month', mnz)
              .set('date', ee.Date.fromYMD(ynz,mnz,1))
              .set('system:time_start',ee.Date.fromYMD(ynz,mnz,1).millis())
              .set('ID',ee.Date.fromYMD(ynz,mnz,1));
    });
  }).flatten());

byMonth = byMonth.filterDate(startDate, endDate);

// Export.image.toAsset({
//   image: byMonth, 
//   description: outFilename, 
//   assetId: 'imageStats4/' + outFilename,
//   region: geogBounds, 
//   scale: 10,
//   maxPixels: 1e10});



// Create another byMonth dataset with the original
var byMonth2 = s2;


// ----------------------------------------------------------------------------------------
// Create User Interface
// ----------------------------------------------------------------------------------------


// Create a panel to hold our widgets.
var panel = ui.Panel();
panel.style().set('width', '300px');

// Create an intro panel with labels.
var intro = ui.Panel([
  ui.Label({
    value: 'VI Chart Inspector',
    style: {fontSize: '20px', fontWeight: 'bold'}
  }),
  ui.Label('Click a point on the map to inspect.')
]);
panel.add(intro);

// panels to hold lon/lat values
var lon = ui.Label();
var lat = ui.Label();
panel.add(ui.Panel([lon, lat], ui.Panel.Layout.flow('horizontal')));

// Register a callback on the default map to be invoked when the map is clicked
Map.onClick(function(coords) {
  // Update the lon/lat panel with values from the click event.
  lon.setValue('lon: ' + coords.lon.toFixed(5)),
  lat.setValue('lat: ' + coords.lat.toFixed(5));
  var point = ee.Geometry.Point(coords.lon, coords.lat);

    
  // Create an VI chart of monthly aggregates.
  var viChart = ui.Chart.image.series(byMonth.select(['VI']), point, ee.Reducer.mean(), 10);
  
  viChart.setChartType('ScatterChart');
  
  viChart.setOptions({
      title: 'Monthly',
      vAxis: {title: 'GCVI'},
      hAxis: {title: 'Date', format: 'MMM', gridlines: {count: 12}},
    });
    panel.widgets().set(2, viChart);
  
  var viChart2 = ui.Chart.image.series(byMonth2.select(['VI']), point, ee.Reducer.mean(), 10);
  
  viChart2.setChartType('ScatterChart');
  
  viChart2.setOptions({
      title: 'Raw',
      vAxis: {title: 'GCVI'},
      hAxis: {title: 'Date', format: 'MMM', gridlines: {count: 12}},
    });
    panel.widgets().set(3, viChart2);

  });



Map.style().set('cursor', 'crosshair');

// Add the panel to the ui.root.
ui.root.insert(0, panel);


Map.centerObject(geometry, 13); 
Map.setOptions('HYBRID');




