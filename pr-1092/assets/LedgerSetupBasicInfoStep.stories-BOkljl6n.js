import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,c as n,i as r,s as i}from"./LedgerSetupAbandonButton-CEnnEMUn.js";import{n as a,t as o}from"./LedgerSetupWizard-C4MHSyKX.js";async function s(e){let t=l(e.ownerDocument.body);await c.click(await t.findByRole(`button`,{name:`下一步`}))}var c,l,u,d,f,p,m;e((()=>{a(),t(),{userEvent:c,within:l}=__STORYBOOK_MODULE_TEST__,u={title:`Organisms/Ledgers/LedgerSetupBasicInfoStep`,component:o,decorators:n,args:{actions:r(null),...i,progress:null},parameters:{viewport:{defaultViewport:`mobile2`}}},d={name:`默认`},f={name:`本地校验错误`,play:async({canvasElement:e})=>{let t=l(e.ownerDocument.body);await c.clear(await t.findByRole(`textbox`,{name:`账本名称`})),await s(e)}},p={name:`纯本地下一步`,play:async({canvasElement:e})=>{await s(e)}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "默认"
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "本地校验错误",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.clear(await body.findByRole("textbox", {
      name: "账本名称"
    }));
    await clickNext(canvasElement);
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "纯本地下一步",
  play: async ({
    canvasElement
  }) => {
    await clickNext(canvasElement);
  }
}`,...p.parameters?.docs?.source}}},m=[`Default`,`ValidationError`,`LocalStepChange`]}))();export{d as Default,p as LocalStepChange,f as ValidationError,m as __namedExportsOrder,u as default};