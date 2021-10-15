/** Internal Dependencies */
import { ANNOTATIONS_NAMES } from 'utils/constants';
import RectNode from './RectNode';
import EllipseNode from './EllipseNode';
import PolygonNode from './PolygonNode';
import TextNode from './TextNode';
import ImageNode from './ImageNode';
import LineNode from './LineNode';
import ArrowNode from './ArrowNode';
import PenNode from './PenNode';

export const ANNOTATION_NAMES_TO_COMPONENT = {
  [ANNOTATIONS_NAMES.RECT]: RectNode,
  [ANNOTATIONS_NAMES.ELLIPSE]: EllipseNode,
  [ANNOTATIONS_NAMES.POLYGON]: PolygonNode,
  [ANNOTATIONS_NAMES.TEXT]: TextNode,
  [ANNOTATIONS_NAMES.IMAGE]: ImageNode,
  [ANNOTATIONS_NAMES.LINE]: LineNode,
  [ANNOTATIONS_NAMES.ARROW]: ArrowNode,
  [ANNOTATIONS_NAMES.PEN]: PenNode,
};