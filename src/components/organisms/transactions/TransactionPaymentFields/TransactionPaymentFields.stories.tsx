import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  transactionErrorCodes,
  transactionPaymentValidationErrorMessages,
} from "internal/transaction";

import { TransactionPaymentFields } from "./TransactionPaymentFields";
import {
  createPaymentFieldsProps,
  createPaymentRows,
  paymentFieldsAccountOptions,
  paymentFieldsCashAccount,
} from "./transactionPaymentFields.testUtils";

const meta = {
  title: "Organisms/Transactions/TransactionPaymentFields",
  component: TransactionPaymentFields,
  args: createPaymentFieldsProps({}),
} satisfies Meta<typeof TransactionPaymentFields>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleAccount: Story = {
  name: "单账户（默认）",
};

export const MultiAccountBalanced: Story = {
  name: "多账户平衡（行数已达同币种账户数）",
  args: createPaymentFieldsProps({
    payments: createPaymentRows(["2000", "1500"]),
  }),
};

export const MultiAccountUnbalanced: Story = {
  name: "多账户不平衡",
  args: createPaymentFieldsProps({ payments: createPaymentRows(["2000", ""]) }),
};

export const MultiAccountWithZeroAmount: Story = {
  name: "含 0 金额行",
  args: createPaymentFieldsProps({
    payments: createPaymentRows(["3500", "0"]),
  }),
};

export const SingleAccountWithoutAddableAccount: Story = {
  name: "没有其他同币种账户（不显示添加入口）",
  args: createPaymentFieldsProps({
    accountOptions: [
      paymentFieldsAccountOptions[0]!,
      paymentFieldsAccountOptions[2]!,
    ],
  }),
};

export const MultiAccountWithFieldError: Story = {
  name: "多账户显示错误时保留添加入口",
  args: createPaymentFieldsProps({
    accountOptions: [...paymentFieldsAccountOptions, paymentFieldsCashAccount],
    fieldError:
      transactionPaymentValidationErrorMessages[
        transactionErrorCodes.paymentTotalMismatch
      ],
    payments: createPaymentRows(["2000", ""]),
  }),
};
