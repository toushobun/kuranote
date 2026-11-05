import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{r as n,s as r}from"./ledgerSetup-D2XiCCx_.js";import{n as i,t as a}from"./LedgerSetupAccountAddSheet-BtRYZS9g.js";var o,s,c,l,u,d,f,p,m;e((()=>{o=t(),n(),i(),{useArgs:s}=__STORYBOOK_MODULE_PREVIEW_API__,{userEvent:c,within:l}=__STORYBOOK_MODULE_TEST__,u={title:`Organisms/Ledgers/LedgerSetupAccountAddSheet`,component:a,args:{accounts:[{name:`现金`,type:`cash`},{name:`楽天銀行`,templateKey:`楽天銀行`,type:`bank`}],candidates:r.accountCandidates.bank,name:``,onAdd:()=>{},onClose:()=>{},onNameChange:()=>{},open:!0,type:`bank`},render:function(e){let[,t]=s();return(0,o.jsx)(a,{...e,onNameChange:e=>t({name:e})})},parameters:{viewport:{defaultViewport:`mobile2`}}},d={name:`有候选（已添加的显示 ✓）`,play:async({canvasElement:e})=>{let t=l(e.ownerDocument.body);await c.click(await t.findByRole(`button`,{name:`三菱UFJ銀行`}))}},f={name:`无候选（现金 / 无模板币种）`,args:{candidates:[]}},p={name:`重名错误`,play:async({canvasElement:e})=>{let t=l(e.ownerDocument.body);await c.click(await t.findByRole(`button`,{name:`楽天銀行 已添加`}))}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "有候选（已添加的显示 ✓）",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "三菱UFJ銀行"
    }));
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "无候选（现金 / 无模板币种）",
  args: {
    candidates: []
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "重名错误",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "楽天銀行 已添加"
    }));
  }
}`,...p.parameters?.docs?.source}}},m=[`WithCandidates`,`WithoutCandidates`,`DuplicateName`]}))();export{p as DuplicateName,d as WithCandidates,f as WithoutCandidates,m as __namedExportsOrder,u as default};