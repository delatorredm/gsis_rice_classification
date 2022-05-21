/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var unsup = ee.Image("users/ddel528/weighted_mode_Iloilo_v007_wet_final"),
    wet = ee.Image("users/ddel528/imageStats4/imageStats4_decadal_wet_2019"),
    annual = ee.Image("users/ddel528/imageStats4/imageStats4_decadal_annual_2019"),
    iloilo_bdy = ee.FeatureCollection("users/ddel528/ph3adm_iloilo_dissolved");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Visualize initial data
Map.addLayer(unsup,
            {min: 1, max: 6, palette: ['green','red','cyan','yellow','pink','blue']},
            'unsupervised clustered',
            false);

// Visualize data with forest, urban and water mask
var masked = unsup.updateMask(unsup.gte(3).and(unsup.lte(5)));
Map.addLayer(masked,
            {min: 3, max: 5, palette: ['cyan','yellow','pink']},
            'masked classes',
            false);
            
// Map.addLayer(ee.Image().paint(iloilo_bdy, 0, 2), {palette:['red']}, "Iloilo Province", true);

// Convert to an imagecollection
var iloilo = ee.FeatureCollection(iloilo_bdy);
Map.addLayer(iloilo, 0, 'iloilo');

var sample_points = masked.sample({
  region: iloilo,
  scale: 10,
  numPixels: 1250,
  seed: 5,
  geometries: true
});

Map.addLayer(sample_points);
print(sample_points);

Export.table.toDrive({
  collection: sample_points, 
  description: 'sample_points', 
  fileNamePrefix: 'sample_points', 
  fileFormat: 'KMZ'
});

