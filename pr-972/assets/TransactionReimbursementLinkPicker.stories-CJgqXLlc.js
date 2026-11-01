import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./TransactionReimbursementLinkPicker-BR7KXqNb.js";import{n as r,t as i}from"./transactions-Drf7jnZ1.js";var a,o,s,c,l,u,d,f,p,m,h;e((()=>{r(),t(),{expect:a,screen:o,userEvent:s,within:c}=__STORYBOOK_MODULE_TEST__,l={title:`Organisms/Transactions/TransactionReimbursementLinkPicker`,component:n,args:{onChange(){},value:null}},u={},d={name:`报销金额包含未核销净收益`,args:{incomeAmount:`1500`,value:{accountCurrency:`JPY`,amount:`1200`,categoryName:`午餐`,id:`reimbursement-item-1`,parentCategoryName:`饮食`,refundedAmount:`200`,remainingRefundableAmount:`1000`,transactionAt:`2026-08-15T10:00:00.000Z`,transactionRecordId:`transaction-1`}}},f={items:[i({account_currency:`JPY`,categoryItems:[{amount:`1200`,categoryName:`午餐`,categoryType:`expense`,id:`reimbursement-item-1`,parentCategoryName:`饮食`,refundedAmount:`200`,remainingRefundableAmount:`1000`}]})],nextOffset:null,totalCount:1},p={name:`搜索单选候选`,args:{incomeAmount:`1000`,loadSearchPageAction:async()=>f},parameters:{viewport:{defaultViewport:`mobile2`}},play:async({canvasElement:e})=>{await s.click(c(e).getByRole(`button`,{name:`选择报销明细`})),await s.click(await o.findByRole(`tab`,{name:`搜索`})),await s.type(o.getByLabelText(`搜索关键词`),`午餐{Enter}`),await o.findByRole(`button`,{name:`选择报销明细 午餐`})}},m={name:`与收款账户币种不一致的候选置灰`,args:{accountCurrency:`USD`,incomeAmount:`1000`,loadSearchPageAction:async()=>f},parameters:{viewport:{defaultViewport:`mobile2`}},play:async({canvasElement:e})=>{await s.click(c(e).getByRole(`button`,{name:`选择报销明细`})),await s.click(await o.findByRole(`tab`,{name:`搜索`})),await s.type(o.getByLabelText(`搜索关键词`),`午餐{Enter}`),await a(await o.findByRole(`button`,{name:`选择报销明细 午餐`})).toBeDisabled(),await a(o.getByText(`与收款账户币种（USD）不一致，不可选择`)).toBeVisible()}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "报销金额包含未核销净收益",
  args: {
    incomeAmount: "1500",
    value: {
      accountCurrency: "JPY",
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
}`,...d.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
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
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "与收款账户币种不一致的候选置灰",
  args: {
    accountCurrency: "USD",
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
    await expect(await screen.findByRole("button", {
      name: "选择报销明细 午餐"
    })).toBeDisabled();
    await expect(screen.getByText("与收款账户币种（USD）不一致，不可选择")).toBeVisible();
  }
}`,...m.parameters?.docs?.source}}},h=[`Default`,`PartialReimbursement`,`SingleSelectSearch`,`CurrencyMismatchedCandidates`]}))();export{m as CurrencyMismatchedCandidates,u as Default,d as PartialReimbursement,p as SingleSelectSearch,h as __namedExportsOrder,l as default};