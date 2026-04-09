# 9thWaka Pricing & Withdrawal Implementation Guide

This guide provides developers with the exact fields and logic required to display service pricing and handle withdrawals correctly on the platform.

---

## 1. Utility Service Pricing

To show the correct "Exact Price to Pay" for the five core services, you must access specific fields in the controller response.

### Core Pricing Formula (Calculated by Backend)
The system uses a **3-Fee Model** to ensure profitability:
`User Price = (Vendor Cost + Markup % + Fixed Processing Fee + Bill Service Charge)`

### Controller: `PricingController`
- **Endpoint**: `GET /admin/pricing-preview` or `GET /admin/service-costs`
- **Response Key**: `preview` or `summary`

| Service | Field to Access | Description |
| :--- | :--- | :--- |
| **Airtime** | `systemPrice` | The final price the user pays for a specific face value. |
| **Data** | `systemPrice` | The exact price for the data plan bundle. |
| **Cable TV** | `userPrice` | The final amount including the provider face value and platform fees. |
| **Electricity** | `userPrice` | The amount to be paid for the requested power units. |
| **Betting** | `userPrice` | The final amount to be paid into the betting wallet. |

> [!IMPORTANT]
> Always use the fields above instead of manually adding markups in the frontend. The backend handles "Break-even Protection" which might adjust the price upward if the markup would result in a loss.

---

## 2. Withdrawal Implementation

Withdrawals follow a tiered fee structure and provide a "Free Transfer" mechanism.

### Fee Preview
Before initiating a withdrawal, you should call the fee preview endpoint to show the user exactly what they will be charged.

- **Endpoint**: `POST /api/withdrawals/fee-preview`
- **Request Body**: `{ "amount": number }`

#### Response Fields to Display:
| Field | UI Label | Purpose |
| :--- | :--- | :--- |
| `baseFee` | **Processing Fee** | The standard platform fee based on the amount tier. |
| `vat` | **VAT (7.5%)** | The government-mandated VAT on the transaction fee. |
| `stampDuty` | **Stamp Duty** | Regulatory charge for transactions over ₦10,000. |
| `totalFee` | **Total Service Fee** | The sum of all the above. |
| `freeWithdrawalBadge` | **Promotion** | If this string is present (e.g., `"DAILY_FREE_QUOTA"`), a free transfer is active. |

### Handling Free Transfers
The admin can activate free transfers via the **Withdrawal Hub**. When active:
1.  The `totalFee` will be **0** (or significantly reduced depending on waiver settings).
2.  The `freeWithdrawalBadge` will serve as a visual indicator to the user that they are enjoying a platform-subsidized transfer.

### Withdrawal Modal Checklist:
- [ ] **Current Balance**: Show the user's withdrawable balance (Deposits only for customers; Earnings+Deposits for riders).
- [ ] **Fee Breakdown**: Explicitly list Processing Fee, VAT, and Stamp Duty.
- [ ] **Final Deduction**: Show `Amount + Total Fee`.
- [ ] **PIN Requirement**: Ensure the transaction PIN input is visible if `isPinEnabled` is true in the user profile.

---

## 3. Financial Reconciliation
If you are debugging profit tracking, refer to the `metadata.platformGain` field in the `Withdrawal` model. This shows the **Net Platform Profit** after subtracting the provider cost (e.g., Payscribe flat fee).

---

> [!TIP]
> Periodically trigger the **Financial Reconciliation Sync** in the Admin Wallet to ensure all ledger balances match external provider funds.
