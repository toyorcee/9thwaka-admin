# Admin API Endpoints

This document outlines the available API endpoints for the admin dashboard and suggests a page structure for the admin website.

## Suggested Admin Pages

- **Dashboard:** A central hub displaying key metrics from `/api/admin/stats`.
- **Order Management:** A section to view and manage all orders.
  - **All Orders:** A table for viewing all orders with search and filter capabilities (`/api/admin/orders`).
  - **Order Details:** A view for individual orders, allowing for cancellations and price adjustments.
- **User Management:** Separate pages for managing riders and customers.
  - **Riders:** A list of all riders, with details on their earnings and status (`/api/admin/riders`).
  - **Customers:** A list of all customers and their order history (`/api/admin/customers`).
- **Promotions & Rewards:** A section for managing promotional activities.
  - **Referrals:** A dashboard for tracking pending and paid referral rewards (`/api/admin/referrals/*`).
  - **User-Specific Bonuses:** A page to look up individual user bonuses for Streaks and Gold Status.
- **Application Settings:** A page for configuring application-wide settings (`/api/admin/settings`).
- **Promo Configuration:** A page to manage all promotional settings, including a master toggle and individual controls for each promo type (`/api/promo-config/*`).

 ## Dashboard

### GET /api/admin/stats

Retrieves statistics for the admin dashboard.

- **Controller:** `getAdminStats` in `controllers/adminController.js`
- **Description:** Fetches a comprehensive set of statistics for the admin dashboard, including:
    - **Order Statistics:** Total orders, pending orders, active orders, completed orders, cancelled orders, and today's orders.
    - **Rider Statistics:** Total riders, online riders, blocked riders, and verified riders.
    - **Customer Statistics:** Total number of customers.
    - **Revenue:** Today's total revenue.

## Orders

### GET /api/admin/orders

Retrieves a list of all orders.

- **Controller:** `getAllOrders` in `controllers/adminController.js`
- **Description:** Fetches a paginated list of all orders. Supports searching and filtering by status.

### PATCH /api/admin/orders/:id/cancel

Cancels a specific order.

- **Controller:** `adminCancelOrder` in `controllers/adminController.js`
- **Description:** Marks a specific order as cancelled.

### PATCH /api/admin/orders/:id/price

Updates the price of a specific order.

- **Controller:** `adminUpdateOrderPrice` in `controllers/adminController.js`
- **Description:** Allows an admin to update the price of a specific order.

## Riders

### GET /api/admin/riders

Retrieves a list of all riders.

- **Controller:** `getAllRiders` in `controllers/adminController.js`
- **Description:** Fetches a paginated list of all riders.

### GET /api/admin/riders/:riderId/earnings

Retrieves the earnings for a specific rider.

- **Controller:** `getRiderEarnings` in `controllers/adminController.js`
- **Description:** Fetches the earnings for a specific rider.

## Customers

### GET /api/admin/customers

Retrieves a list of all customers.

- **Controller:** `getAllCustomers` in `controllers/adminController.js`
- **Description:** Fetches a paginated list of all customers.

## Settings

### GET /api/admin/settings

Retrieves the current application settings.

- **Controller:** `getSettings` in `controllers/settingsController.js`
- **Description:** Fetches the current application settings, such as rates.

### PUT /api/admin/settings

Updates the application settings.

- **Controller:** `updateSettings` in `controllers/settingsController.js`
- **Description:** Allows an admin to update the application settings.

## Referrals

### GET /api/admin/referrals/pending

Retrieves pending referral rewards.

- **Controller:** `getPendingReferralRewards` in `controllers/adminController.js`
- **Description:** Fetches a list of referral rewards that are pending payment.

### GET /api/admin/referrals/paid

Retrieves paid referral rewards.

- **Controller:** `getPaidReferralRewards` in `controllers/adminController.js`
- **Description:** Fetches a paginated list of referral rewards that have been paid.

### GET /api/admin/referrals/stats

Retrieves referral statistics.

- **Controller:** `getReferralStats` in `controllers/adminController.js`
- **Description:** Fetches statistics about referrals, such as the total number of referrals and the total amount paid in rewards.

## Streak Bonuses

### GET /api/admin/streak/:userId

Retrieves streak bonus statistics for a user.

- **Controller:** `getAdminStreakStats` in `controllers/streakBonusController.js`
- **Description:** Fetches streak bonus statistics for a specific user.

## Gold Status

## Promotion Management

These endpoints are defined in `c:\Users\HP\Desktop\OfficeDevLibrary\9thwaka\server\routes\promoConfig.js`.

### GET /api/promo-config/

- **Description:** Retrieves the current configuration for all promotional features, including Referral, Streak, and Gold Status promos.
- **Controller Function:** `getPromoConfig`

### PUT /api/promo-config/referral

- **Description:** Updates the settings for the referral promotion.
- **Controller Function:** `updateReferralPromo`

### PUT /api/promo-config/streak

- **Description:** Updates the settings for the streak bonus promotion.
- **Controller Function:** `updateStreakPromo`

### PUT /api/promo-config/gold-status

- **Description:** Updates the settings for the Gold Status promotion.
- **Controller Function:** `updateGoldStatusPromo`

### PUT /api/promo-config/toggle-all

- **Description:** A master switch to enable or disable all promotions at once.
- **Controller Function:** `toggleAllPromos`

### GET /api/admin/gold-status/:userId

Retrieves gold status statistics for a user.

- **Controller:** `getAdminGoldStatusStats` in `controllers/goldStatusController.js`
- **Description:** Fetches gold status statistics for a specific user.
