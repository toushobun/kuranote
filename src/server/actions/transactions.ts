"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentLedgerContext } from "lib/ledger/current-ledger";
import {
  newTransactionErrorHref,
  routePaths,
  transactionsErrorHref,
} from "config/paths";
import {
  createTransactionService,
  voidTransactionService,
} from "server/services/transactions";
import { validateTransactionForm } from "utils/transactionValidation";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getCurrentUserAndLedger() {
  const context = await getCurrentLedgerContext();

  if (!context.currentLedger) {
    redirect(routePaths.ledgerSetup);
  }

  return {
    currentLedger: context.currentLedger,
    userId: context.userId,
  };
}

export async function createTransaction(formData: FormData) {
  const validation = validateTransactionForm(formData);

  if (!validation.ok) {
    redirect(newTransactionErrorHref(validation.error));
  }

  const { currentLedger } = await getCurrentUserAndLedger();
  const values = validation.value;

  const result = await createTransactionService({
    accountId: values.accountId,
    amount: values.amount,
    categoryId: values.categoryId,
    ledgerId: currentLedger.id,
    merchantId: values.merchantId,
    note: values.note,
    transactionAt: values.transactionAt,
    type: values.type,
  });

  if (!result.ok) redirect(newTransactionErrorHref(result.error));

  revalidatePath(routePaths.accounts);
  revalidatePath(routePaths.transactions);
  revalidatePath(routePaths.transactionsNew);
  redirect(routePaths.transactions);
}

export async function voidTransaction(formData: FormData) {
  const transactionRecordId = String(
    formData.get("transactionRecordId") ?? "",
  ).trim();

  if (!uuidPattern.test(transactionRecordId)) {
    redirect(transactionsErrorHref("void_invalid"));
  }

  const { currentLedger } = await getCurrentUserAndLedger();

  const result = await voidTransactionService({
    ledgerId: currentLedger.id,
    transactionRecordId,
  });

  if (!result.ok) redirect(transactionsErrorHref(result.error));

  revalidatePath(routePaths.accounts);
  revalidatePath(routePaths.transactions);
  redirect(routePaths.transactions);
}
