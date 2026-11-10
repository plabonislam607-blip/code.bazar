# Code Bazar — Android-first Firebase + Cloudflare Pages setup

This is a static digital-products storefront. The user panel uses exactly three files (`index.html`, `style.css`, `script.js`). The admin panel is a single `admin.html` containing its own HTML, CSS and JavaScript. Firebase Realtime Database stores product metadata, payment methods and orders. No Firebase Storage is needed; use public image URLs and external download links.

## Included files
- `index.html` — SEO-ready storefront, product browsing, auth and checkout UI.
- `style.css` — responsive storefront styles.
- `script.js` — Firebase Auth/Realtime Database user logic.
- `admin.html` — single-file admin panel.
- `database.rules.json` — Realtime Database rules with public product metadata separated from private download URLs.
- `robots.txt`, `sitemap.xml`, `favicon.svg`, `_headers`.

## 1. Create Firebase project on your phone
1. Open https://console.firebase.google.com/ and create a project.
2. In Project settings → General → Your apps, add a Web app and copy the Firebase configuration.
3. Go to Build → Authentication → Get started → Sign-in method. Enable **Email/Password**.
4. Go to Build → Realtime Database → Create database. Choose a region and start in locked mode.
5. Copy the Realtime Database URL. It normally resembles `https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com` but use the exact URL shown by Firebase.

## 2. Add Firebase config to both panels
In `script.js` and inside the `<script>` near the bottom of `admin.html`, replace all placeholder values in `firebaseConfig` with the same values from your Firebase web app. Do not add service-account private keys or admin SDK secrets. Firebase web configuration is public by design; database rules protect the data.

## 3. Create your first admin safely
1. Deploy the site (or use the Firebase app configuration locally) and create an account using the normal user panel, or create a user in Firebase Console → Authentication → Users → Add user.
2. In Firebase Console → Authentication → Users, copy that user's **UID**.
3. Open Realtime Database → Data. Add a node named `admins`, then add a child whose key is your exact UID and whose value is boolean `true` (not the text string "true"). Example: `/admins/PASTE_YOUR_UID_HERE = true`.
4. Only your own trusted UID should be listed. Do not make the entire `admins` node writable by the public.

## 4. Publish database rules
1. Open `database.rules.json` and copy its JSON.
2. In Realtime Database → Rules, replace the rules and Publish.
3. The rules let guests read the public catalogue and payment instructions, let signed-in users create pending orders for themselves, and restrict product/settings writes and order review to listed admins.
4. Test with a second non-admin account. It must not be able to write products or approve an order.

**Important security note:** Realtime Database rules are a critical boundary. Review them before accepting real payments. Because this is a client-side static site, product prices and names are sent by the browser when an order is created. The included starter rules restrict the fields but cannot independently calculate authoritative prices. For a production store, add a trusted backend/Cloudflare Worker to validate the current product price and create the order server-side. Until then, manually compare each order amount against the current product price before approving.

## 5. Configure payment methods
1. Sign in at `/admin.html` with your Firebase user.
2. Go to Payment methods → Add method.
3. Enter a label (e.g. bKash or Nagad), receiving number, account type, and short instructions. Enable it and save.
4. The active methods appear at checkout. Use only numbers you control and confirm the number carefully.

## 6. Add digital products
1. Open Admin → Products.
2. Enter product name, price in BDT, category, public image URL, short description, tags and download URL.
3. Use a public image URL from a source you control. No Firebase Storage upload is implemented.
4. For Google Drive, configure the file's sharing so intended buyers can open it. A public “anyone with the link” URL can be forwarded by buyers; it is not strong copy protection.
5. Save. The admin panel stores the download URL in the private `/productSecrets` node; public product details are saved separately.

## 7. Download-link security design
The public catalogue is stored at `/productsPublic/{productId}` and contains only display fields. Download URLs are stored separately at `/productSecrets/{productId}/downloadUrl`, which is readable/writable only by admins. When approving an order, the admin panel copies the private URL into the order record. The buyer can read only `/ordersByUser/{theirUid}` and sees the URL only after approval; the admin reads `/orders` for the full order queue.

This is safer than hiding a download link in the user interface. However, external links such as Google Drive “anyone with the link” URLs can still be forwarded after an approved buyer receives them. For stronger protection, use a trusted backend/Cloudflare Worker to validate the current product price and issue expiring links.

**Important pricing note:** the static client sends the price shown in the browser when creating an order. The starter rules validate the fields and protect order status/download access, but cannot independently calculate an authoritative price. Manually compare the order amount against the current product price before approving. For a production store, add a trusted backend to calculate prices server-side.

## 8. Deploy on Cloudflare Pages (free static hosting)
1. Extract this ZIP on your Android phone using a file manager.
2. Open https://dash.cloudflare.com/ → Workers & Pages → Create → Pages → Direct Upload (the wording may change).
3. Create a project and upload the extracted folder or a ZIP if the current upload screen accepts ZIP files. If ZIP upload is not offered, use Git integration or a compatible upload workflow.
4. Ensure `index.html` is at the site root, not buried in an extra folder.
5. Deploy. Open the generated `https://PROJECT.pages.dev` URL and check the site.
6. Open `/admin.html` to use the admin panel.

## 9. Replace SEO placeholder URLs
After you get your live URL, replace `https://YOUR-SITE.pages.dev/` in `index.html` (canonical, Open Graph and JSON-LD), `robots.txt`, and `sitemap.xml` with your actual Cloudflare Pages URL. Redeploy and submit `/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

## 10. Test checklist
- Guest can view products and prices, but cannot submit an order without signing in.
- New user can sign up and sign in.
- Checkout displays only enabled payment methods.
- User can submit sender number + transaction ID after paying.
- Order remains pending until the admin verifies the transaction.
- Only the admin UID can approve/reject orders or edit products/payment methods.
- Approved download links appear in My Orders; rejected/pending orders show no download button.
- Test security rules using Firebase Rules Playground or the Rules simulator.

## Current limitations
- Payment is manual; no payment gateway or automatic transaction verification is connected.
- No file uploads; image URLs and download URLs are entered by admin.
- Product listing is loaded client-side from Firebase; search engines may not index dynamically loaded products as well as server-rendered pages. Submit the homepage sitemap and add individual public product URLs / server-rendered metadata later if SEO for every product is important.
- A sitemap placeholder contains only the homepage. Update it when your public URL is known and generate product URLs if you add real product pages.
