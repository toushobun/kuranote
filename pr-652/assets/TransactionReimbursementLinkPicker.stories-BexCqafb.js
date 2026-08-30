import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./TransactionReimbursementLinkPicker-3Nmq9dE0.js";import{n as r,t as i}from"./transactions-Drf7jnZ1.js";var a,o,s,c,l,u,d,f,p;e((()=>{r(),t(),{screen:a,userEvent:o,within:s}=__STORYBOOK_MODULE_TEST__,c={title:`Organisms/Transactions/TransactionReimbursementLinkPicker`,component:n,args:{onChange(){},value:null}},l={},u={name:`报销金额包含未核销净收益`,args:{incomeAmount:`1500`,value:{accountCurrency:`JPY`,accountId:`account-1`,amount:`1200`,categoryName:`午餐`,id:`reimbursement-item-1`,parentCategoryName:`饮食`,refundedAmount:`200`,remainingRefundableAmount:`1000`,transactionAt:`2026-08-15T10:00:00.000Z`,transactionRecordId:`transaction-1`}}},d={items:[i({account_currency:`JPY`,categoryItems:[{accountId:`account-1`,amount:`1200`,categoryName:`午餐`,categoryType:`expense`,id:`reimbursement-item-1`,parentCategoryName:`饮食`,refundedAmount:`200`,remainingRefundableAmount:`1000`}]})],nextOffset:null,totalCount:1},f={name:`搜索单选候选`,args:{incomeAmount:`1000`,loadSearchPageAction:async()=>d},parameters:{viewport:{defaultViewport:`mobile2`}},play:async({canvasElement:e})=>{await o.click(s(e).getByRole(`button`,{name:`选择报销明细`})),await o.click(await a.findByRole(`tab`,{name:`搜索`})),await o.type(a.getByLabelText(`搜索关键词`),`午餐{Enter}`),await a.findByRole(`button`,{name:`选择报销明细 午餐`})}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "报销金额包含未核销净收益",
  args: {
    incomeAmount: "1500",
    value: {
      accountCurrency: "JPY",
      accountId: "account-1",
      amount: "1200",
      categoryName: "午餐",
      id: "reimbursement-item-1",
      parentCategoryName: "饮食",
      refundedAmount: "200",
      remainingRefundableAmount: "1000",
      transactionAt: "2026-08-15T10:00:00.000Z",
      transactionRecordId: "transaction-1"
    }
  }
}`,...u.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "搜索单选候选",
  args: {
    incomeAmount: "1000",
    loadSearchPageAction: async () => reimbursementSearchPage
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "选择报销明细"
    }));
    await userEvent.click(await screen.findByRole("tab", {
      name: "搜索"
    }));
    await userEvent.type(screen.getByLabelText("搜索关键词"), "午餐{Enter}");
    await screen.findByRole("button", {
      name: "选择报销明细 午餐"
    });
  }
}`,...f.parameters?.docs?.source}}},p=[`Default`,`PartialReimbursement`,`SingleSelectSearch`]}))();export{l as Default,u as PartialReimbursement,f as SingleSelectSearch,p as __namedExportsOrder,c as default};