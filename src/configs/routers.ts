import PHONE_PRICE from '../pages/phone-price.jsx';
import INDEX from '../pages/index.jsx';
import DATA_IMPORT from '../pages/data-import.jsx';
import DATA_MANAGEMENT from '../pages/data-management.jsx';
import ADMIN_UPLOAD from '../pages/admin-upload.jsx';
import DATA_CLEANUP from '../pages/data-cleanup.jsx';
import PRICE_EDITOR from '../pages/price-editor.jsx';

export const routers = [
  { id: "phone-price", component: PHONE_PRICE },
  { id: "index", component: INDEX },
  { id: "data-import", component: DATA_IMPORT },
  { id: "data-management", component: DATA_MANAGEMENT },
  { id: "admin-upload", component: ADMIN_UPLOAD },
  { id: "data-cleanup", component: DATA_CLEANUP },
  { id: "price-editor", component: PRICE_EDITOR }
];