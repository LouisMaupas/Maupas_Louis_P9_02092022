/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";

import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";
// mock like on Dashboard.js
jest.mock("../app/store", () => mockStore);

// mockImplementation
window.$ = jest.fn().mockImplementation(() => {
  return {
    click: jest.fn(),
    width: jest.fn(),
    find: jest.fn().mockImplementation(() => {
      return {
        HTMLElement: `<div class="modal-body">
        </div>`,
        html: jest.fn(),
      };
    }),
    modal: jest.fn().mockImplementation(() => {
      return {
        click: jest.fn(),
      };
    }),
  };
});

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
    });

    test("Then bill icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      // FIXME [Ajout de tests unitaires et d'intégration] to-do write expect expression
      expect(windowIcon.classList[0]).toEqual("active-icon");
    });
    // GET Bills
    test("Then bills should be ordered from latest to earliest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      expect(
        screen.getAllByTestId("bill-name").map((billDOM) => billDOM.innerHTML)
      ).toEqual(["encore", "test3", "test2", "test1"]);
    });

    test("Then if I click on 'Nouvelle note de frais' I should be redirected to /#employee/bill/new", () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      userEvent.click(screen.getByText("Nouvelle note de frais"));
      expect(window.location.href).toEqual(
        "http://localhost/#employee/bill/new"
      );
    });

    test("Then if I click on the eye icon, a justificatif should be displayed", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      const iconEyes = screen.getAllByTestId("icon-eye");
      userEvent.click(iconEyes[0]);
      expect(screen.getByText("Justificatif")).toBeTruthy();
    });
  });
});

// GET Bills in case of error
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      expect(
        screen.getAllByTestId("bill-name").map((billDOM) => billDOM.innerHTML)
      ).toEqual(["encore", "test3", "test2", "test1"]);
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.findByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        const message = await screen.findByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
