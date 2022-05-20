/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var iloilo_bdy = ee.FeatureCollection("users/ddel528/ph3adm_iloilo_dissolved"),
    exportGeometry = 
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
          [122.41285914233686, 11.440743530010431]]]),
    image = ee.Image("users/ddel528/weighted_mode_FuLL"),
    sample_pts = ee.FeatureCollection("users/ddel528/accuracy_assessment_iloilo_v2");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/**=========================================================================
* ADD BOUNDARY LAYER FOR VISUALIZATION
* ====================================================================== */

// Add Layer of Iloilo BOundary
Map.addLayer(ee.Image().paint(iloilo_bdy, 0, 2), {palette:['red']}, "Iloilo Province", false);
// Map.centerObject(clusterResult, 9);
Map.setOptions('HYBRID')

/**=========================================================================
* SAMPLE LAYERS
* ====================================================================== */
var clippedImage = image.clipToCollection(iloilo_bdy);


print(sample_pts)
Map.addLayer(sample_pts)

