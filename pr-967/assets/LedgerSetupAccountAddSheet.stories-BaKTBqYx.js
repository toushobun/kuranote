import{i as e}from"./preload-helper-D2yxXLVK.js";import{r as t,s as n}from"./ledgerSetup-D2XiCCx_.js";import{n as r,t as i}from"./LedgerSetupAccountAddSheet-w0hOczuG.js";var a,o,s,c,l,u,d;e((()=>{t(),r(),{userEvent:a,within:o}=__STORYBOOK_MODULE_TEST__,s={title:`Organisms/Ledgers/LedgerSetupAccountAddSheet`,component:i,args:{accounts:[{name:`现金`,type:`cash`},{name:`楽天銀行`,templateKey:`楽天銀行`,type:`bank`}],candidates:n.accountCandidates.bank,onAdd:()=>{},onClose:()=>{},open:!0,type:`bank`},parameters:{viewport:{defaultViewport:`mobile2`}}},c={name:`有候选（已添加的显示 ✓）`,play:async({canvasElement:e})=>{let t=o(e.ownerDocument.body);await a.click(await t.findByRole(`button`,{name:`三菱UFJ銀行`}))}},l={name:`无候选（现金 / 无模板币种）`,args:{candidates:[]}},u={name:`重名错误`,play:async({canvasElement:e})=>{let t=o(e.ownerDocument.body);await a.click(await t.findByRole(`button`,{name:`楽天銀行 已添加`}))}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "有候选（已添加的显示 ✓）",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "三菱UFJ銀行"
    }));
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "无候选（现金 / 无模板币种）",
  args: {
    candidates: []
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "重名错误",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "楽天銀行 已添加"
    }));
  }
}`,...u.parameters?.docs?.source}}},d=[`WithCandidates`,`WithoutCandidates`,`DuplicateName`]}))();export{u as DuplicateName,c as WithCandidates,l as WithoutCandidates,d as __namedExportsOrder,s as default};