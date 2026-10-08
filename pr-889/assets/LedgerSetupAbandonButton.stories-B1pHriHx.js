import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,n,s as r,t as i}from"./LedgerSetupAbandonButton-Bo5oin9p.js";var a,o,s,c,l,u,d,f;e((()=>{t(),n(),{userEvent:a,within:o}=__STORYBOOK_MODULE_TEST__,s={title:`Organisms/Ledgers/LedgerSetupAbandonButton`,component:i,decorators:r,args:{action:async()=>({}),ledgerId:`ledger`,ledgerName:`我们家`,onSuccess:()=>{}}},c={name:`放弃创建入口`},l={name:`危险确认`,play:async({canvasElement:e})=>{await a.click(o(e).getByRole(`button`,{name:`放弃创建`}))}},u={name:`处理中`,args:{action:()=>new Promise(()=>{})},play:async({canvasElement:e})=>{await a.click(o(e).getByRole(`button`,{name:`放弃创建`}));let t=await o(e.ownerDocument.body).findByRole(`dialog`,{name:`放弃创建「我们家」？`});await a.click(o(t).getByRole(`button`,{name:`放弃创建`}))}},d={...u,name:`放弃失败`,args:{action:async()=>({error:`该账本已有其他成员或邀请，无法放弃创建。`,errorKey:`story`})}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "放弃创建入口"
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "危险确认",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "放弃创建"
    }));
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "处理中",
  args: {
    action: () => new Promise(() => {})
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "放弃创建"
    }));
    const dialog = await within(canvasElement.ownerDocument.body).findByRole("dialog", {
      name: "放弃创建「我们家」？"
    });
    await userEvent.click(within(dialog).getByRole("button", {
      name: "放弃创建"
    }));
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  ...Pending,
  name: "放弃失败",
  args: {
    action: async () => ({
      error: "该账本已有其他成员或邀请，无法放弃创建。",
      errorKey: "story"
    })
  }
}`,...d.parameters?.docs?.source}}},f=[`Default`,`Confirm`,`Pending`,`Failure`]}))();export{l as Confirm,c as Default,d as Failure,u as Pending,f as __namedExportsOrder,s as default};