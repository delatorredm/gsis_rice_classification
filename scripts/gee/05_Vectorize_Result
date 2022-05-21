var geometry = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[122.4192194191721, 10.772923243475274],
          [122.4192194191721, 10.68015921838602],
          [122.52513448875217, 10.68015921838602],
          [122.52513448875217, 10.772923243475274]]], null, false);


/**************************************************************************
 * Purpose: Create a Vector From Unsup Classification Result
 * Author: Daniel dela Torre
 * Date: 15 April 2020
 *************************************************************************/ 

/**=========================================================================
 * IMPORT CLASSIFIER RESULT
 * ====================================================================== */

var img = ee.Image("users/ddel528/myExportImageTask_v2");

/**=========================================================================
 * VECTOR CLUSTERS AND SELECT A SAMPLE FOR TIME-SERIES ANALYSIS
 * ====================================================================== */

/********    CHANGE THIS SECTION TO MATCH CLUSTER OF INTEREST   ***********/
var class_num = ee.Number(9);
img = img.eq(class_num).selfMask(); // Select only specified class and 
/********                           END                         ***********/

var resultUnMaskPoly = img   // mask out others
  .reduceToVectors({
    geometry: geometry, // Need to specify extent
    geometryType: 'polygon',
    scale: 10});

// Union join the result
resultUnMaskPoly = resultUnMaskPoly.union(1000);

// Print for debugging
print('resultUnMaskPoly',resultUnMaskPoly);

// Display
Map.addLayer(resultUnMaskPoly,{},'resultUnMaskPoly',true);

/**=========================================================================
 * Generate a sample (from original raster image)
 * ====================================================================== */

var sample = img.sample({
  region: geometry,
  numPixels: 6000,
  geometries: true,
});
print('sample', sample);
Map.addLayer(sample, {color:'red'}, 'sample');

var outName = ee.String('SampleUnsupClassResult_');
outName = outName.cat(ee.String(class_num));
print(outName.getInfo());

/**=========================================================================
 * Export
 * ====================================================================== */

Export.table.toAsset({
  collection: sample, 
  description: outName.getInfo()});

/**/