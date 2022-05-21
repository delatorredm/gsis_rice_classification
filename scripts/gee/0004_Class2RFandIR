/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var nia_lateral = ee.FeatureCollection("users/ddel528/NIA_Iloilo_LateralCanals"),
    nia_main = ee.FeatureCollection("users/ddel528/NIA_Iloilo_MainCanals"),
    classified_wet = ee.Image("users/ddel528/classified_maps_2019_final_v01/classified_wet_v001"),
    classified_dry = ee.Image("users/ddel528/classified_maps_2019_final_v01/classified_dry_v001"),
    unsup_dry = ee.Image("users/ddel528/weighted_mode_Iloilo_v007_dry_final"),
    unsup_wet = ee.Image("users/ddel528/weighted_mode_Iloilo_v007_wet_final"),
    iloilo_bdy = ee.FeatureCollection("users/ddel528/ph3adm_iloilo_dissolved"),
    roi = 
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
//=========== Import classified image and select only the rice class

/// CHANGE IF WET OR DRY SEASON 1. image and 2. unsup layer
var image = classified_dry.clip(iloilo_bdy); // change for the corresponding season
var unsup = unsup_dry.clip(iloilo_bdy);

// Masking the original classified layer
var masked = image.updateMask(unsup.gte(3).and(unsup.lte(5)));
masked = masked.updateMask(masked.eq(4)); // Select only rice class (eq 4) other crop is eq 5 
// Visualize masked layer
var imageVis = {min: 3, max: 5, palette: ['cyan','yellow','pink']};
Map.addLayer(masked,
            imageVis,
            'classified random forest',
            false);

//=========== Process ancillary layers ======== //

// ========== ELEVATION  ============ //
var dataset = ee.Image('JAXA/ALOS/AW3D30/V2_2');
var elevation = dataset.select('AVE_DSM');
var elevationVis = {
  min: 0,
  max: 50, // 50 metres is the max elevation for irrigation
  palette: ['0000ff', '00ffff', 'ffff00', 'ff0000', 'ffffff'],
};
var seamask = dataset.select('AVE_MSK').neq(3); // no water body
Map.addLayer(elevation.mask(seamask), elevationVis, 'Elevation', false);

// ========== SLOPE  ============ //
var slope = ee.Terrain.slope(dataset.select('AVE_DSM'));
var slopeVis = {
  min: 0,
  max: 5, // 50 metres is the max elevation for irrigation
  palette: ['0000ff', '00ffff', 'ffff00', 'ff0000', 'ffffff'],
};
var seamask = dataset.select('AVE_MSK').neq(3); // no water body
Map.setCenter(122.5737, 10.90767, 14);
Map.addLayer(slope.mask(seamask), slopeVis, 'Slope', false);

// APPLY ELEVATION AND SLOPE MASKS
var masked_dsm = masked.updateMask(elevation.lte(50).and(slope.lte(3))); // elevation LTE 50m and slope LTE 3deg
Map.addLayer(masked_dsm.mask(seamask).clip(iloilo_bdy), imageVis, 'masked_DSM', false);


// ========== IRRIGATION CANALS ============== //
// Use only if visualizing
Map.addLayer(ee.Image().paint(nia_lateral, 0, 2), {palette:['red']}, "nia_lateral", false);

// Convert to an imagecollection
var merge_canal = nia_main.merge(nia_lateral);
var flattened_irr = merge_canal.map(function(feature){
  return(feature.buffer(1000));
});
Map.addLayer(flattened_irr, 0, 'merged and buffered canals', false);

// ========== IRRIGATED CLASS ================= //
var irrigated_class = masked_dsm.clip(flattened_irr);

Map.addLayer(irrigated_class, {palette:['red']}, 'irrigated', false);

// ========== RAINFED CLASS ================= //
var rainfed_class = masked.remap([4], [3], 0, 'b1');

rainfed_class = rainfed_class.updateMask(irrigated_class.unmask().neq(4));

Map.addLayer(rainfed_class, {palette:['yellow']}, 'rainfed class');

/*=========================================================================
                EXPORT SCRIPT
 *====================================================================== */

Export.image.toDrive({
  image: irrigated_class, 
  description: 'irrigated_class_dry_v001', 
  region: roi, 
  scale: 10, 
  maxPixels: 1e13, 
  fileFormat: 'GeoTIFF', 
});

Export.image.toDrive({
  image: rainfed_class, 
  description: 'rainfed_class_dry_v001', 
  region: roi, 
  scale: 10, 
  maxPixels: 1e13, 
  fileFormat: 'GeoTIFF', 
});
