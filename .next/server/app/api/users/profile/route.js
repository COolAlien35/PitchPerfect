/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/users/profile/route";
exports.ids = ["app/api/users/profile/route"];
exports.modules = {

/***/ "(rsc)/./app/api/users/profile/route.ts":
/*!****************************************!*\
  !*** ./app/api/users/profile/route.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var jsonwebtoken__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! jsonwebtoken */ \"(rsc)/./node_modules/jsonwebtoken/index.js\");\n/* harmony import */ var jsonwebtoken__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(jsonwebtoken__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _src_firebase__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/src/firebase */ \"(rsc)/./src/firebase.js\");\n/* harmony import */ var firebase_firestore__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! firebase/firestore */ \"(rsc)/./node_modules/firebase/firestore/dist/index.mjs\");\n\n\n\n\nasync function GET(req) {\n    try {\n        const token = req.headers.get('authorization')?.split(' ')[1];\n        if (!token) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'No token provided'\n            }, {\n                status: 401\n            });\n        }\n        console.log(\"Received token in Profile API:\", token); // Added for debugging\n        if (!process.env.JWT_SECRET) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'JWT_SECRET not configured'\n            }, {\n                status: 500\n            });\n        }\n        const decoded = jsonwebtoken__WEBPACK_IMPORTED_MODULE_1___default().verify(token, \"9b68f9e05278a077f736cb566186c7437d9afd075e5c8c3170ead132bb4a77e3\");\n        // In Firestore, the user ID from Firebase Auth is typically used as the document ID\n        const userRef = (0,firebase_firestore__WEBPACK_IMPORTED_MODULE_3__.doc)(_src_firebase__WEBPACK_IMPORTED_MODULE_2__.db, 'users', decoded.id);\n        const userSnap = await (0,firebase_firestore__WEBPACK_IMPORTED_MODULE_3__.getDoc)(userRef);\n        if (!userSnap.exists()) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'User not found'\n            }, {\n                status: 404\n            });\n        }\n        const user = userSnap.data();\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(user);\n    } catch (err) {\n        console.error(\"Profile API Error:\", err);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: 'Failed to fetch profile: ' + err.message,\n            details: err.stack\n        }, {\n            status: 400\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL3VzZXJzL3Byb2ZpbGUvcm91dGUudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQXdEO0FBQ3pCO0FBQ0s7QUFDYTtBQUUxQyxlQUFlSyxJQUFJQyxHQUFnQjtJQUN4QyxJQUFJO1FBQ0YsTUFBTUMsUUFBUUQsSUFBSUUsT0FBTyxDQUFDQyxHQUFHLENBQUMsa0JBQWtCQyxNQUFNLElBQUksQ0FBQyxFQUFFO1FBRTdELElBQUksQ0FBQ0gsT0FBTztZQUNWLE9BQU9QLHFEQUFZQSxDQUFDVyxJQUFJLENBQUM7Z0JBQUVDLE9BQU87WUFBb0IsR0FBRztnQkFBRUMsUUFBUTtZQUFJO1FBQ3pFO1FBRUFDLFFBQVFDLEdBQUcsQ0FBQyxrQ0FBa0NSLFFBQVEsc0JBQXNCO1FBRTVFLElBQUksQ0FBQ1MsUUFBUUMsR0FBRyxDQUFDQyxVQUFVLEVBQUU7WUFDM0IsT0FBT2xCLHFEQUFZQSxDQUFDVyxJQUFJLENBQUM7Z0JBQUVDLE9BQU87WUFBNEIsR0FBRztnQkFBRUMsUUFBUTtZQUFJO1FBQ2pGO1FBRUEsTUFBTU0sVUFBVWxCLDBEQUFVLENBQUNNLE9BQU87UUFFbEMsb0ZBQW9GO1FBQ3BGLE1BQU1jLFVBQVVsQix1REFBR0EsQ0FBQ0QsNkNBQUVBLEVBQUUsU0FBU2lCLFFBQVFHLEVBQUU7UUFDM0MsTUFBTUMsV0FBVyxNQUFNbkIsMERBQU1BLENBQUNpQjtRQUU5QixJQUFJLENBQUNFLFNBQVNDLE1BQU0sSUFBSTtZQUN0QixPQUFPeEIscURBQVlBLENBQUNXLElBQUksQ0FBQztnQkFBRUMsT0FBTztZQUFpQixHQUFHO2dCQUFFQyxRQUFRO1lBQUk7UUFDdEU7UUFFQSxNQUFNWSxPQUFPRixTQUFTRyxJQUFJO1FBRTFCLE9BQU8xQixxREFBWUEsQ0FBQ1csSUFBSSxDQUFDYztJQUMzQixFQUFFLE9BQU9FLEtBQVU7UUFDakJiLFFBQVFGLEtBQUssQ0FBQyxzQkFBc0JlO1FBQ3BDLE9BQU8zQixxREFBWUEsQ0FBQ1csSUFBSSxDQUFDO1lBQUVDLE9BQU8sOEJBQThCZSxJQUFJQyxPQUFPO1lBQUVDLFNBQVNGLElBQUlHLEtBQUs7UUFBQyxHQUFHO1lBQUVqQixRQUFRO1FBQUk7SUFDbkg7QUFDRiIsInNvdXJjZXMiOlsiQzpcXFVzZXJzXFxHQVVSQVYgR1VQVEFcXFBpdGNoUGVyZmVjdFxcYXBwXFxhcGlcXHVzZXJzXFxwcm9maWxlXFxyb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVxdWVzdCwgTmV4dFJlc3BvbnNlIH0gZnJvbSAnbmV4dC9zZXJ2ZXInO1xyXG5pbXBvcnQgand0IGZyb20gJ2pzb253ZWJ0b2tlbic7XHJcbmltcG9ydCB7IGRiIH0gZnJvbSAnQC9zcmMvZmlyZWJhc2UnO1xyXG5pbXBvcnQgeyBkb2MsIGdldERvYyB9IGZyb20gJ2ZpcmViYXNlL2ZpcmVzdG9yZSc7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gR0VUKHJlcTogTmV4dFJlcXVlc3QpIHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgdG9rZW4gPSByZXEuaGVhZGVycy5nZXQoJ2F1dGhvcml6YXRpb24nKT8uc3BsaXQoJyAnKVsxXTtcclxuXHJcbiAgICBpZiAoIXRva2VuKSB7XHJcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnTm8gdG9rZW4gcHJvdmlkZWQnIH0sIHsgc3RhdHVzOiA0MDEgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc29sZS5sb2coXCJSZWNlaXZlZCB0b2tlbiBpbiBQcm9maWxlIEFQSTpcIiwgdG9rZW4pOyAvLyBBZGRlZCBmb3IgZGVidWdnaW5nXHJcblxyXG4gICAgaWYgKCFwcm9jZXNzLmVudi5KV1RfU0VDUkVUKSB7XHJcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnSldUX1NFQ1JFVCBub3QgY29uZmlndXJlZCcgfSwgeyBzdGF0dXM6IDUwMCB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkZWNvZGVkID0gand0LnZlcmlmeSh0b2tlbiwgXCI5YjY4ZjllMDUyNzhhMDc3ZjczNmNiNTY2MTg2Yzc0MzdkOWFmZDA3NWU1YzhjMzE3MGVhZDEzMmJiNGE3N2UzXCIpIGFzIHsgaWQ6IHN0cmluZyB9O1xyXG4gICAgXHJcbiAgICAvLyBJbiBGaXJlc3RvcmUsIHRoZSB1c2VyIElEIGZyb20gRmlyZWJhc2UgQXV0aCBpcyB0eXBpY2FsbHkgdXNlZCBhcyB0aGUgZG9jdW1lbnQgSURcclxuICAgIGNvbnN0IHVzZXJSZWYgPSBkb2MoZGIsICd1c2VycycsIGRlY29kZWQuaWQpO1xyXG4gICAgY29uc3QgdXNlclNuYXAgPSBhd2FpdCBnZXREb2ModXNlclJlZik7XHJcblxyXG4gICAgaWYgKCF1c2VyU25hcC5leGlzdHMoKSkge1xyXG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ1VzZXIgbm90IGZvdW5kJyB9LCB7IHN0YXR1czogNDA0IH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHVzZXIgPSB1c2VyU25hcC5kYXRhKCk7XHJcblxyXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHVzZXIpO1xyXG4gIH0gY2F0Y2ggKGVycjogYW55KSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiUHJvZmlsZSBBUEkgRXJyb3I6XCIsIGVycik7XHJcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ0ZhaWxlZCB0byBmZXRjaCBwcm9maWxlOiAnICsgZXJyLm1lc3NhZ2UsIGRldGFpbHM6IGVyci5zdGFjayB9LCB7IHN0YXR1czogNDAwIH0pO1xyXG4gIH1cclxufVxyXG4iXSwibmFtZXMiOlsiTmV4dFJlc3BvbnNlIiwiand0IiwiZGIiLCJkb2MiLCJnZXREb2MiLCJHRVQiLCJyZXEiLCJ0b2tlbiIsImhlYWRlcnMiLCJnZXQiLCJzcGxpdCIsImpzb24iLCJlcnJvciIsInN0YXR1cyIsImNvbnNvbGUiLCJsb2ciLCJwcm9jZXNzIiwiZW52IiwiSldUX1NFQ1JFVCIsImRlY29kZWQiLCJ2ZXJpZnkiLCJ1c2VyUmVmIiwiaWQiLCJ1c2VyU25hcCIsImV4aXN0cyIsInVzZXIiLCJkYXRhIiwiZXJyIiwibWVzc2FnZSIsImRldGFpbHMiLCJzdGFjayJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./app/api/users/profile/route.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fusers%2Fprofile%2Froute&page=%2Fapi%2Fusers%2Fprofile%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fusers%2Fprofile%2Froute.ts&appDir=C%3A%5CUsers%5CGAURAV%20GUPTA%5CPitchPerfect%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CGAURAV%20GUPTA%5CPitchPerfect&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fusers%2Fprofile%2Froute&page=%2Fapi%2Fusers%2Fprofile%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fusers%2Fprofile%2Froute.ts&appDir=C%3A%5CUsers%5CGAURAV%20GUPTA%5CPitchPerfect%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CGAURAV%20GUPTA%5CPitchPerfect&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_GAURAV_GUPTA_PitchPerfect_app_api_users_profile_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/users/profile/route.ts */ \"(rsc)/./app/api/users/profile/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/users/profile/route\",\n        pathname: \"/api/users/profile\",\n        filename: \"route\",\n        bundlePath: \"app/api/users/profile/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\GAURAV GUPTA\\\\PitchPerfect\\\\app\\\\api\\\\users\\\\profile\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Users_GAURAV_GUPTA_PitchPerfect_app_api_users_profile_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZ1c2VycyUyRnByb2ZpbGUlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRnVzZXJzJTJGcHJvZmlsZSUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRnVzZXJzJTJGcHJvZmlsZSUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNHQVVSQVYlMjBHVVBUQSU1Q1BpdGNoUGVyZmVjdCU1Q2FwcCZwYWdlRXh0ZW5zaW9ucz10c3gmcGFnZUV4dGVuc2lvbnM9dHMmcGFnZUV4dGVuc2lvbnM9anN4JnBhZ2VFeHRlbnNpb25zPWpzJnJvb3REaXI9QyUzQSU1Q1VzZXJzJTVDR0FVUkFWJTIwR1VQVEElNUNQaXRjaFBlcmZlY3QmaXNEZXY9dHJ1ZSZ0c2NvbmZpZ1BhdGg9dHNjb25maWcuanNvbiZiYXNlUGF0aD0mYXNzZXRQcmVmaXg9Jm5leHRDb25maWdPdXRwdXQ9JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQStGO0FBQ3ZDO0FBQ3FCO0FBQ3lCO0FBQ3RHO0FBQ0E7QUFDQTtBQUNBLHdCQUF3Qix5R0FBbUI7QUFDM0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsc0RBQXNEO0FBQzlEO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQzBGOztBQUUxRiIsInNvdXJjZXMiOlsiIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCJDOlxcXFxVc2Vyc1xcXFxHQVVSQVYgR1VQVEFcXFxcUGl0Y2hQZXJmZWN0XFxcXGFwcFxcXFxhcGlcXFxcdXNlcnNcXFxccHJvZmlsZVxcXFxyb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvdXNlcnMvcHJvZmlsZS9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL3VzZXJzL3Byb2ZpbGVcIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL3VzZXJzL3Byb2ZpbGUvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCJDOlxcXFxVc2Vyc1xcXFxHQVVSQVYgR1VQVEFcXFxcUGl0Y2hQZXJmZWN0XFxcXGFwcFxcXFxhcGlcXFxcdXNlcnNcXFxccHJvZmlsZVxcXFxyb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHdvcmtBc3luY1N0b3JhZ2UsXG4gICAgICAgIHdvcmtVbml0QXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fusers%2Fprofile%2Froute&page=%2Fapi%2Fusers%2Fprofile%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fusers%2Fprofile%2Froute.ts&appDir=C%3A%5CUsers%5CGAURAV%20GUPTA%5CPitchPerfect%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CGAURAV%20GUPTA%5CPitchPerfect&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(rsc)/./src/firebase.js":
/*!*************************!*\
  !*** ./src/firebase.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   auth: () => (/* binding */ auth),\n/* harmony export */   createUserWithEmailAndPassword: () => (/* reexport safe */ firebase_auth__WEBPACK_IMPORTED_MODULE_1__.createUserWithEmailAndPassword),\n/* harmony export */   db: () => (/* binding */ db),\n/* harmony export */   provider: () => (/* binding */ provider),\n/* harmony export */   signInWithEmailAndPassword: () => (/* reexport safe */ firebase_auth__WEBPACK_IMPORTED_MODULE_1__.signInWithEmailAndPassword),\n/* harmony export */   signInWithPopup: () => (/* reexport safe */ firebase_auth__WEBPACK_IMPORTED_MODULE_1__.signInWithPopup)\n/* harmony export */ });\n/* harmony import */ var firebase_app__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! firebase/app */ \"(rsc)/./node_modules/firebase/app/dist/index.mjs\");\n/* harmony import */ var firebase_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! firebase/auth */ \"(rsc)/./node_modules/firebase/auth/dist/index.mjs\");\n/* harmony import */ var firebase_firestore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! firebase/firestore */ \"(rsc)/./node_modules/firebase/firestore/dist/index.mjs\");\n\n\n\n// TODO: Add SDKs for Firebase products that you want to use\n// https://firebase.google.com/docs/web/setup#available-libraries\n// Your web app's Firebase configuration\n// For Firebase JS SDK v7.20.0 and later, measurementId is optional\nconst firebaseConfig = {\n    apiKey: \"AIzaSyAXNubRG-Sk4xT2X0AUyUWvpowMFCEmHpI\",\n    authDomain: \"pitchperfect-209b3.firebaseapp.com\",\n    projectId: \"pitchperfect-209b3\",\n    storageBucket: \"pitchperfect-209b3.firebasestorage.app\",\n    messagingSenderId: \"487840944049\",\n    appId: \"1:487840944049:web:499288a992f9bb34cf7790\",\n    measurementId: \"G-V2QKB89Y49\"\n};\n// Initialize Firebase\nconst app = (0,firebase_app__WEBPACK_IMPORTED_MODULE_0__.initializeApp)(firebaseConfig);\nconst auth = (0,firebase_auth__WEBPACK_IMPORTED_MODULE_1__.getAuth)(app);\nconst provider = new firebase_auth__WEBPACK_IMPORTED_MODULE_1__.GoogleAuthProvider();\nconst db = (0,firebase_firestore__WEBPACK_IMPORTED_MODULE_2__.getFirestore)(app);\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvZmlyZWJhc2UuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQzZDO0FBQzRGO0FBQ2xFO0FBQ3ZFLDREQUE0RDtBQUM1RCxpRUFBaUU7QUFFakUsd0NBQXdDO0FBQ3hDLG1FQUFtRTtBQUNuRSxNQUFNVSxpQkFBaUI7SUFDckJDLFFBQVE7SUFDUkMsWUFBWTtJQUNaQyxXQUFXO0lBQ1hDLGVBQWU7SUFDZkMsbUJBQW1CO0lBQ25CQyxPQUFPO0lBQ1BDLGVBQWU7QUFDakI7QUFFQSxzQkFBc0I7QUFDdEIsTUFBTUMsTUFBTWxCLDJEQUFhQSxDQUFDVTtBQUMxQixNQUFNUyxPQUFPbEIsc0RBQU9BLENBQUNpQjtBQUNyQixNQUFNRSxXQUFXLElBQUlsQiw2REFBa0JBO0FBQ3ZDLE1BQU1tQixLQUFLZixnRUFBWUEsQ0FBQ1k7QUFFbUYiLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcR0FVUkFWIEdVUFRBXFxQaXRjaFBlcmZlY3RcXHNyY1xcZmlyZWJhc2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiXHJcbmltcG9ydCB7IGluaXRpYWxpemVBcHAgfSBmcm9tIFwiZmlyZWJhc2UvYXBwXCI7XHJcbmltcG9ydCB7IGdldEF1dGgsIEdvb2dsZUF1dGhQcm92aWRlciwgc2lnbkluV2l0aFBvcHVwLCBjcmVhdGVVc2VyV2l0aEVtYWlsQW5kUGFzc3dvcmQsIHNpZ25JbldpdGhFbWFpbEFuZFBhc3N3b3JkIH0gZnJvbSBcImZpcmViYXNlL2F1dGhcIjtcclxuaW1wb3J0IHsgZ2V0RmlyZXN0b3JlLCBkb2MsIGdldERvYywgc2V0RG9jIH0gZnJvbSBcImZpcmViYXNlL2ZpcmVzdG9yZVwiO1xyXG4vLyBUT0RPOiBBZGQgU0RLcyBmb3IgRmlyZWJhc2UgcHJvZHVjdHMgdGhhdCB5b3Ugd2FudCB0byB1c2VcclxuLy8gaHR0cHM6Ly9maXJlYmFzZS5nb29nbGUuY29tL2RvY3Mvd2ViL3NldHVwI2F2YWlsYWJsZS1saWJyYXJpZXNcclxuXHJcbi8vIFlvdXIgd2ViIGFwcCdzIEZpcmViYXNlIGNvbmZpZ3VyYXRpb25cclxuLy8gRm9yIEZpcmViYXNlIEpTIFNESyB2Ny4yMC4wIGFuZCBsYXRlciwgbWVhc3VyZW1lbnRJZCBpcyBvcHRpb25hbFxyXG5jb25zdCBmaXJlYmFzZUNvbmZpZyA9IHtcclxuICBhcGlLZXk6IFwiQUl6YVN5QVhOdWJSRy1TazR4VDJYMEFVeVVXdnBvd01GQ0VtSHBJXCIsXHJcbiAgYXV0aERvbWFpbjogXCJwaXRjaHBlcmZlY3QtMjA5YjMuZmlyZWJhc2VhcHAuY29tXCIsXHJcbiAgcHJvamVjdElkOiBcInBpdGNocGVyZmVjdC0yMDliM1wiLFxyXG4gIHN0b3JhZ2VCdWNrZXQ6IFwicGl0Y2hwZXJmZWN0LTIwOWIzLmZpcmViYXNlc3RvcmFnZS5hcHBcIixcclxuICBtZXNzYWdpbmdTZW5kZXJJZDogXCI0ODc4NDA5NDQwNDlcIixcclxuICBhcHBJZDogXCIxOjQ4Nzg0MDk0NDA0OTp3ZWI6NDk5Mjg4YTk5MmY5YmIzNGNmNzc5MFwiLFxyXG4gIG1lYXN1cmVtZW50SWQ6IFwiRy1WMlFLQjg5WTQ5XCJcclxufTtcclxuXHJcbi8vIEluaXRpYWxpemUgRmlyZWJhc2VcclxuY29uc3QgYXBwID0gaW5pdGlhbGl6ZUFwcChmaXJlYmFzZUNvbmZpZyk7XHJcbmNvbnN0IGF1dGggPSBnZXRBdXRoKGFwcCk7XHJcbmNvbnN0IHByb3ZpZGVyID0gbmV3IEdvb2dsZUF1dGhQcm92aWRlcigpO1xyXG5jb25zdCBkYiA9IGdldEZpcmVzdG9yZShhcHApO1xyXG5cclxuZXhwb3J0IHsgYXV0aCwgcHJvdmlkZXIsIHNpZ25JbldpdGhQb3B1cCwgY3JlYXRlVXNlcldpdGhFbWFpbEFuZFBhc3N3b3JkLCBzaWduSW5XaXRoRW1haWxBbmRQYXNzd29yZCwgZGIgfTsiXSwibmFtZXMiOlsiaW5pdGlhbGl6ZUFwcCIsImdldEF1dGgiLCJHb29nbGVBdXRoUHJvdmlkZXIiLCJzaWduSW5XaXRoUG9wdXAiLCJjcmVhdGVVc2VyV2l0aEVtYWlsQW5kUGFzc3dvcmQiLCJzaWduSW5XaXRoRW1haWxBbmRQYXNzd29yZCIsImdldEZpcmVzdG9yZSIsImRvYyIsImdldERvYyIsInNldERvYyIsImZpcmViYXNlQ29uZmlnIiwiYXBpS2V5IiwiYXV0aERvbWFpbiIsInByb2plY3RJZCIsInN0b3JhZ2VCdWNrZXQiLCJtZXNzYWdpbmdTZW5kZXJJZCIsImFwcElkIiwibWVhc3VyZW1lbnRJZCIsImFwcCIsImF1dGgiLCJwcm92aWRlciIsImRiIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/firebase.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ "dns":
/*!**********************!*\
  !*** external "dns" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("dns");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "http2":
/*!************************!*\
  !*** external "http2" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("http2");

/***/ }),

/***/ "net":
/*!**********************!*\
  !*** external "net" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("net");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "process":
/*!**************************!*\
  !*** external "process" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("process");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "tls":
/*!**********************!*\
  !*** external "tls" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("tls");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@firebase","vendor-chunks/@grpc","vendor-chunks/protobufjs","vendor-chunks/long","vendor-chunks/@protobufjs","vendor-chunks/lodash.camelcase","vendor-chunks/idb","vendor-chunks/firebase","vendor-chunks/semver","vendor-chunks/jsonwebtoken","vendor-chunks/ecdsa-sig-formatter","vendor-chunks/safe-buffer","vendor-chunks/ms","vendor-chunks/lodash.once","vendor-chunks/lodash.isstring","vendor-chunks/lodash.isplainobject","vendor-chunks/lodash.isnumber","vendor-chunks/lodash.isinteger","vendor-chunks/lodash.isboolean","vendor-chunks/lodash.includes","vendor-chunks/buffer-equal-constant-time"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fusers%2Fprofile%2Froute&page=%2Fapi%2Fusers%2Fprofile%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fusers%2Fprofile%2Froute.ts&appDir=C%3A%5CUsers%5CGAURAV%20GUPTA%5CPitchPerfect%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CGAURAV%20GUPTA%5CPitchPerfect&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();