import { onRequest as __api___path___js_onRequest } from "/home/ki/projects/xdnmb-pwa/functions/api/[[path]].js"
import { onRequest as __image___path___js_onRequest } from "/home/ki/projects/xdnmb-pwa/functions/image/[[path]].js"
import { onRequest as __post___path___js_onRequest } from "/home/ki/projects/xdnmb-pwa/functions/post/[[path]].js"
import { onRequest as __thumb___path___js_onRequest } from "/home/ki/projects/xdnmb-pwa/functions/thumb/[[path]].js"

export const routes = [
    {
      routePath: "/api/:path*",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api___path___js_onRequest],
    },
  {
      routePath: "/image/:path*",
      mountPath: "/image",
      method: "",
      middlewares: [],
      modules: [__image___path___js_onRequest],
    },
  {
      routePath: "/post/:path*",
      mountPath: "/post",
      method: "",
      middlewares: [],
      modules: [__post___path___js_onRequest],
    },
  {
      routePath: "/thumb/:path*",
      mountPath: "/thumb",
      method: "",
      middlewares: [],
      modules: [__thumb___path___js_onRequest],
    },
  ]