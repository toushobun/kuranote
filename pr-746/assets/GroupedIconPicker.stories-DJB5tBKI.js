import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./UserThemeProvider-BH5CyC0n.js";import{a as o,n as s,t as c}from"./categoryEmojis-97W7iB8O.js";import{n as l,t as u}from"./GroupedIconPicker-w3wP2UvT.js";var d,f,p,m,h,g,_,v,y,b,x,S;t((()=>{d=r(),o(),f=e(n()),i(),l(),{expect:p,userEvent:m,within:h}=__STORYBOOK_MODULE_TEST__,g={title:`Molecules/UI/GroupedIconPicker`,component:u,decorators:[e=>(0,d.jsx)(a,{storageScope:`storybook-grouped-icon-picker`,children:(0,d.jsx)(e,{})})],args:{fieldLabel:`记录图标`,helperText:`选择用于记录的图标。`,inputName:`recordIcon`,value:`☕`,onChange:()=>{},groups:[{id:`food`,label:`餐饮`,groupIcon:`🍴`},{id:`travel`,label:`出行`}],options:[{emoji:`☕`,groupId:`food`,label:`咖啡`,keywords:[]},{emoji:`🍜`,groupId:`food`,label:`面条`,keywords:[]},{emoji:`🚃`,groupId:`travel`,label:`电车`,keywords:[]}]},render:function(e){let[t,n]=(0,f.useState)(e.value);return(0,d.jsx)(u,{...e,value:t,onChange:n})}},_={name:`图标字段`},v={name:`小弹窗分组与草稿选中态`,play:async({canvasElement:e})=>{await m.click(h(e).getByRole(`button`,{name:`选择图标`}));let t=h(await h(e.ownerDocument.body).findByRole(`dialog`));await p(t.getByRole(`heading`,{name:`餐饮 2个图标`})).toBeVisible(),await p(t.getByRole(`heading`,{name:`出行 1个图标`})).toBeVisible(),await m.click(t.getByRole(`button`,{name:`选择电车图标`})),await p(t.getByRole(`button`,{name:`选择电车图标`})).toHaveAttribute(`aria-pressed`,`true`)}},y={name:`空分组`,args:{options:[]},play:async({canvasElement:e})=>{await m.click(h(e).getByRole(`button`,{name:`选择图标`}))}},b={name:`旧图标不可确认，重选有效图标`,args:{value:`📁`},play:async({canvasElement:e})=>{let t=h(e);await m.click(t.getByRole(`button`,{name:`选择图标`}));let n=h(await h(e.ownerDocument.body).findByRole(`dialog`)),r=n.getByRole(`button`,{name:`确定`});await p(r).toBeDisabled(),await m.click(n.getByRole(`button`,{name:`选择面条图标`})),await p(r).toBeEnabled(),await m.click(r),await p(t.getByLabelText(`当前记录图标：🍜`)).toBeVisible()}},x={...v,name:`小弹窗完整分类图标库`,args:{groups:c,options:s,value:`🍜`},play:async({canvasElement:e})=>{await m.click(h(e).getByRole(`button`,{name:`选择图标`}));let t=await h(e.ownerDocument.body).findByRole(`dialog`);await p(t).not.toHaveClass(`MuiDialog-paperFullScreen`),await p(t).toHaveClass(`MuiDialog-paperFullWidth`,`MuiDialog-paperWidthXs`),await p(h(t).getAllByRole(`region`)).toHaveLength(8)}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "图标字段"
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "小弹窗分组与草稿选中态",
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
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "旧图标不可确认，重选有效图标",
  args: {
    value: "📁"
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", {
      name: "选择图标"
    }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));
    const confirm = dialog.getByRole("button", {
      name: "确定"
    });
    await expect(confirm).toBeDisabled();
    await userEvent.click(dialog.getByRole("button", {
      name: "选择面条图标"
    }));
    await expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    await expect(canvas.getByLabelText("当前记录图标：🍜")).toBeVisible();
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  ...Grouped,
  name: "小弹窗完整分类图标库",
  args: {
    groups: categoryEmojiGroups,
    options: categoryEmojiOptions,
    value: "🍜"
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "选择图标"
    }));
    const dialog = await within(canvasElement.ownerDocument.body).findByRole("dialog");
    await expect(dialog).not.toHaveClass("MuiDialog-paperFullScreen");
    await expect(dialog).toHaveClass("MuiDialog-paperFullWidth", "MuiDialog-paperWidthXs");
    await expect(within(dialog).getAllByRole("region")).toHaveLength(8);
  }
}`,...x.parameters?.docs?.source}}},S=[`Default`,`Grouped`,`Empty`,`UnavailableValue`,`CategoryGroups`]}))();export{x as CategoryGroups,_ as Default,y as Empty,v as Grouped,b as UnavailableValue,S as __namedExportsOrder,g as default};