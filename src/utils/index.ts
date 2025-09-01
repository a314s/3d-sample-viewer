


/**
* Build an app URL for a given page name with optional query params.
* - Keeps the original case to match React Router routes like /TutorialEditor.
* - If pageName already includes '/' it is treated as a path.
* - If pageName already contains a query string (e.g., "Tutorial?id=123"), we preserve it
*   and append any extra params with '&'.
*/
export function createPageUrl(
 pageName: string,
 params?: Record<string, string | number | boolean>
) {
 // Normalize to path starting with '/'
 let path = pageName.startsWith('/') ? pageName : `/${pageName}`;

 // If params provided, append them to the query string
 if (params && Object.keys(params).length > 0) {
   const qs = Object.entries(params)
     .filter(([_, v]) => v !== undefined && v !== null)
     .map(
       ([k, v]) =>
         `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
     )
     .join('&');

   if (qs) {
     path += path.includes('?') ? `&${qs}` : `?${qs}`;
   }
 }

 return path;
}