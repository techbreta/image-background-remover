import express, { Router } from "express";

import imageRoute from "./image.route";
import documentRoute from "./document.route";

const router = express.Router();
interface IRoute {
  path: string;
  route: Router;
}

const defaultIRoute: IRoute[] = [
  {
    path: "/image",
    route: imageRoute,
  },
  {
    path: "/document",
    route: documentRoute,
  },
];

// Globally Routes
defaultIRoute.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
