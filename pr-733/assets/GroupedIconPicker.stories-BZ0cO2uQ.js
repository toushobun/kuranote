import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./UserThemeProvider-CvJ_H64d.js";import{n as o,t as s}from"./GroupedIconPicker-DDVw2JNO.js";var c,l,u,d,f,p,m,h,g,_;t((()=>{c=r(),l=e(n()),i(),o(),{expect:u,userEvent:d,within:f}=__STORYBOOK_MODULE_TEST__,p={title:`Molecules/UI/GroupedIconPicker`,component:s,decorators:[e=>(0,c.jsx)(a,{storageScope:`storybook-grouped-icon-picker`,children:(0,c.jsx)(e,{})})],args:{fieldLabel:`记录图标`,helperText:`选择用于记录的图标。`,inputName:`recordIcon`,value:`☕`,onChange:()=>{},groups:[{id:`food`,label:`餐饮`},{id:`travel`,label:`出行`}],options:[{emoji:`☕`,groupId:`food`,label:`咖啡`,keywords:[]},{emoji:`🍜`,groupId:`food`,label:`面条`,keywords:[]},{emoji:`🚃`,groupId:`travel`,label:`电车`,keywords:[]}]},render:function(e){let[t,n]=(0,l.useState)(e.value);return(0,c.jsx)(s,{...e,value:t,onChange:n})}},m={name:`图标字段`},h={name:`全屏分组与草稿选中态`,play:async({canvasElement:e})=>{await d.click(f(e).getByRole(`button`,{name:`选择图标`}));let t=f(await f(e.ownerDocument.body).findByRole(`dialog`));await u(t.getByRole(`heading`,{name:`餐饮 2个图标`})).toBeVisible(),await u(t.getByRole(`heading`,{name:`出行 1个图标`})).toBeVisible(),await d.click(t.getByRole(`button`,{name:`选择电车图标`})),await u(t.getByRole(`button`,{name:`选择电车图标`})).toHaveAttribute(`aria-pressed`,`true`)}},g={name:`空分组`,args:{options:[]},play:async({canvasElement:e})=>{await d.click(f(e).getByRole(`button`,{name:`选择图标`}))}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "图标字段"
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "全屏分组与草稿选中态",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "选择图标"
    }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));
    await expect(dialog.getByRole("heading", {
      name: "餐饮 2个图标"
    })).toBeVisible();
    await expect(dialog.getByRole("heading", {
      name: "出行 1个图标"
    })).toBeVisible();
    await userEvent.click(dialog.getByRole("button", {
      name: "选择电车图标"
    }));
    await expect(dialog.getByRole("button", {
      name: "选择电车图标"
    })).toHaveAttribute("aria-pressed", "true");
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "空分组",
  args: {
    options: []
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "选择图标"
    }));
  }
}`,...g.parameters?.docs?.source}}},_=[`Default`,`Grouped`,`Empty`]}))();export{m as Default,g as Empty,h as Grouped,_ as __namedExportsOrder,p as default};