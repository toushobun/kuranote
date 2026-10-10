import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-F_IW5XFu.js";import{r as i,s as a}from"./ledgerSetup-FkC1q1tT.js";import{n as o,t as s}from"./LedgerSetupAccountAddSheet-CqK_nmZP.js";var c,l,u,d,f,p,m,h;e((()=>{c=t(),i(),n(),o(),{userEvent:l,within:u}=__STORYBOOK_MODULE_TEST__,d={title:`Organisms/Ledgers/LedgerSetupAccountAddSheet`,component:s,decorators:[e=>(0,c.jsx)(r,{children:(0,c.jsx)(e,{})})],args:{accounts:[{name:`现金`,type:`cash`},{name:`楽天銀行`,templateKey:`楽天銀行`,type:`bank`}],candidates:a.accountCandidates.bank,onAdd:()=>{},onClose:()=>{},open:!0,type:`bank`},parameters:{viewport:{defaultViewport:`mobile2`}}},f={name:`有候选（已添加的显示 ✓）`,play:async({canvasElement:e})=>{let t=u(e.ownerDocument.body);await l.click(await t.findByRole(`button`,{name:`三菱UFJ銀行`}))}},p={name:`无候选（现金 / 无模板币种）`,args:{candidates:[]}},m={name:`重名错误`,play:async({canvasElement:e})=>{let t=u(e.ownerDocument.body);await l.click(await t.findByRole(`button`,{name:`楽天銀行 已添加`}))}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "有候选（已添加的显示 ✓）",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "三菱UFJ銀行"
    }));
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "无候选（现金 / 无模板币种）",
  args: {
    candidates: []
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "重名错误",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "楽天銀行 已添加"
    }));
  }
}`,...m.parameters?.docs?.source}}},h=[`WithCandidates`,`WithoutCandidates`,`DuplicateName`]}))();export{m as DuplicateName,f as WithCandidates,p as WithoutCandidates,h as __namedExportsOrder,d as default};