import { Page } from '@playwright/test';
import { LoginPage }         from './LoginPage';
import { DashboardPage }     from './DashboardPage';
import { CartPage }          from './CartPage';
import { OrdersReviewPage }  from './OrdersReviewPage';
import { OrdersHistoryPage } from './OrdersHistoryPage';

export class POManager {
  private loginPage:         LoginPage;
  private dashboardPage:     DashboardPage;
  private cartPage:          CartPage;
  private ordersReviewPage:  OrdersReviewPage;
  private ordersHistoryPage: OrdersHistoryPage;

  constructor(page: Page) {
    this.loginPage         = new LoginPage(page);
    this.dashboardPage     = new DashboardPage(page);
    this.cartPage          = new CartPage(page);
    this.ordersReviewPage  = new OrdersReviewPage(page);
    this.ordersHistoryPage = new OrdersHistoryPage(page);
  }

  getLoginPage():         LoginPage         { return this.loginPage; }
  getDashboardPage():     DashboardPage     { return this.dashboardPage; }
  getCartPage():          CartPage          { return this.cartPage; }
  getOrdersReviewPage():  OrdersReviewPage  { return this.ordersReviewPage; }
  getOrdersHistoryPage(): OrdersHistoryPage { return this.ordersHistoryPage; }
}
