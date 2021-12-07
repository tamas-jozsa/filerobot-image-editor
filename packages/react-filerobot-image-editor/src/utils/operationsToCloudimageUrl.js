// TODO: Check maybe we split this file into folder with a file for each function.
/** Internal Dependencies */
import { ELLIPSE_CROP, TOOLS_IDS, WATERMARK_ANNOTATION_ID } from './constants';
import getImageSealingParams from './getImageSealingParams';
import mapCropBox from './mapCropBox';
import mapNumber from './mapNumber';
import toPrecisedFloat from './toPrecisedFloat';

const generateCropQuery = (crop, previewDimensions, originalDimensions) => {
  const { x, y, width, height } = mapCropBox(
    { ...crop, x: crop.relativeX, y: crop.relativeY },
    previewDimensions,
    originalDimensions,
  );

  return `tl_px=${x},${y}&br_px=${x + width},${y + height}${
    crop.ratio === ELLIPSE_CROP
      ? `&radius=${Math.max(width, height)}&force_format=png`
      : ''
  }`;
};

const generateResizeQuery = ({ width, height } = {}) =>
  `w=${width}&h=${height}`;

// const generateRotationQuery = (rotationAngle) => {
//   switch (rotationAngle) {
//     case 90:
//       return `r=270`;
//     case -90:
//       return `r=90`;
//     default:
//       return `r=${rotationAngle}`;
//   }
// };

const generateWatermarkQuery = (
  watermarkAnnotation = {},
  previewDimensions,
) => {
  const { width, height, x, y, opacity, ...watermark } = watermarkAnnotation;
  const queryParams = `wat=1&wat_gravity=northwest&wat_opacity=${opacity}&wat_pad=${toPrecisedFloat(
    (x / previewDimensions.width) * 100,
    2,
  )}p,${toPrecisedFloat((y / previewDimensions.height) * 100, 2)}p`;

  if (watermarkAnnotation.name === TOOLS_IDS.TEXT) {
    return `${queryParams}&wat_text=${watermark.text.replaceAll(
      '\n',
      '',
    )}&wat_font=${watermark.fontFamily}&wat_color=${watermark.fill.replace(
      '#',
      '',
    )}&wat_fontsize=${watermark.fontSize}`;
  }

  return `${queryParams}&wat_url=${
    watermark.image.src
  }&wat_scale=${toPrecisedFloat(
    (width / previewDimensions.width) * 100,
    2,
  )}p,${toPrecisedFloat(height / previewDimensions.height, 2)}p`;
};

const finetuneNameToParamInfo = {
  Brighten: {
    cloudimage: {
      name: 'bright',
      min: -100,
      max: 100,
    },
    internal: {
      propName: 'brightness',
      min: -1,
      max: 1,
    },
  },
  Contrast: {
    cloudimage: {
      name: 'contrast',
      min: -100,
      max: 100,
    },
    internal: {
      propName: 'contrast',
      min: -100,
      max: 100,
    },
  },
  Blur: {
    cloudimage: {
      name: 'blur',
      min: 0,
      max: 100,
    },
    internal: {
      propName: 'blurRadius',
      min: 0,
      max: 100,
    },
  },
};
const generateFinetuneQuery = (finetunes, finetunesProps = {}) => {
  const queryParams = [];
  finetunes.forEach((finetuneFn) => {
    const finetuneParamInfo =
      finetuneFn.name && finetuneNameToParamInfo[finetuneFn.name];
    if (finetuneParamInfo) {
      const finetuneCloudimageVal = mapNumber(
        finetunesProps[finetuneParamInfo.internal.propName],
        finetuneParamInfo.internal.min,
        finetuneParamInfo.internal.max,
        finetuneParamInfo.cloudimage.min,
        finetuneParamInfo.cloudimage.max,
      );
      queryParams.push(
        `${finetuneParamInfo.cloudimage.name}=${finetuneCloudimageVal}`,
      );
    }
  });

  return queryParams.join('&');
};

const operationsToCloudimageUrl = (
  cloudimage,
  operations,
  previewDimensions,
  originalImage,
) => {
  const { token, version, imageSealing, secureProtocol } = cloudimage;
  const {
    imageSrc,
    adjustments: { crop },
    resize = {},
    finetunes = {},
    finetunesProps,
    annotations = {},
  } = operations;
  const url = `http${secureProtocol ? 's' : ''}://${token}.cloudimg.io/${
    version ? `${version}/` : ''
  }`;

  const operationsQueries = [];

  if (crop.width && crop.height && crop.relativeX && crop.relativeY) {
    operationsQueries.push(
      generateCropQuery(crop, previewDimensions, originalImage),
    );
  }

  if (resize.width || resize.height) {
    operationsQueries.push(
      generateResizeQuery({ ...originalImage, ...resize }),
    );
  }

  // if (orientationOperation) {
  //   rotationQuery = generateRotationQuery(rotationAngle);
  // }

  if (annotations[WATERMARK_ANNOTATION_ID]) {
    operationsQueries.push(
      generateWatermarkQuery(
        annotations[WATERMARK_ANNOTATION_ID],
        previewDimensions,
      ),
    );
  }

  if (finetunes.length > 0 && finetunesProps) {
    operationsQueries.push(generateFinetuneQuery(finetunes, finetunesProps));
  }

  let paramsStr = operationsQueries.join('&');

  if (imageSealing.enable) {
    paramsStr = getImageSealingParams(paramsStr, imageSealing, imageSrc);
  }
  paramsStr = paramsStr.replaceAll(' ', '+');

  const queryPrefixOperator = imageSrc.indexOf('?') === -1 ? '?' : '&';

  return `${url}${imageSrc}${
    paramsStr ? `${queryPrefixOperator}${paramsStr.replace(/&$/, '')}` : ''
  }`;
};

export default operationsToCloudimageUrl;