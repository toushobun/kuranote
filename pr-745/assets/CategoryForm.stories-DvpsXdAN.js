import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-cyXSgGYo.js";import{n as i,t as a}from"./CategoryForm-BdKM7e8Q.js";var o,s,c,l,u,d,f,p,m,h,g;e((()=>{o=t(),n(),i(),{expect:s,userEvent:c,within:l}=__STORYBOOK_MODULE_TEST__,u={title:`Organisms/Categories/CategoryForm`,component:a,decorators:[e=>(0,o.jsx)(r,{storageScope:`storybook-category-dialog`,children:(0,o.jsx)(e,{})})],args:{createCategoryAction:async()=>{},parentOptions:[{id:`expense-food`,name:`🍽️ 餐饮`,type:`expense`},{id:`expense-transport`,name:`🚃 交通`,type:`expense`},{id:`income-main`,name:`💰 收入`,type:`income`}]}},d={name:`新增分类弹窗`},f={name:`新增收入小分类`,play:async({canvasElement:e})=>{await c.click(l(e).getByRole(`button`,{name:`新增分类`}));let t=l(e.ownerDocument.body);await c.click(t.getByRole(`combobox`,{name:`分类类型`})),await c.click(t.getByRole(`option`,{name:`收入`})),await c.click(t.getByRole(`combobox`,{name:`上级分类`})),await s(t.queryByRole(`option`,{name:`🍽️ 餐饮`})).not.toBeInTheDocument(),await c.click(t.getByRole(`option`,{name:`💰 收入`}))}},p={name:`新增表单确认分类图标`,play:async({canvasElement:e})=>{await c.click(l(e).getByRole(`button`,{name:`新增分类`}));let t=l(e.ownerDocument.body);await c.click(t.getByRole(`button`,{name:`选择图标`}));let n=l(t.getByRole(`dialog`,{name:`选择图标`}));await c.click(n.getByRole(`button`,{name:`选择面条图标`})),await c.click(n.getByRole(`button`,{name:`确定`})),await s(t.getByLabelText(`当前分类图标：🍜`)).toBeVisible()}},m={name:`没有上级分类候选`,args:{parentOptions:[]},play:async({canvasElement:e})=>{await c.click(l(e).getByRole(`button`,{name:`新增分类`}))}},h={name:`新增弹窗等宽按钮`,play:async({canvasElement:e})=>{await c.click(l(e).getByRole(`button`,{name:`新增分类`}));let t=l(await l(e.ownerDocument.body).findByRole(`dialog`)),n=t.getByRole(`button`,{name:`取消`}),r=t.getByRole(`button`,{name:`新增分类`});await s(n.getBoundingClientRect().width).toBeCloseTo(r.getBoundingClientRect().width,0),await s(n.getBoundingClientRect().top).toBe(r.getBoundingClientRect().top)}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "新增分类弹窗"
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "新增收入小分类",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "新增分类"
    }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole("combobox", {
      name: "分类类型"
    }));
    await userEvent.click(body.getByRole("option", {
      name: "收入"
    }));
    await userEvent.click(body.getByRole("combobox", {
      name: "上级分类"
    }));
    await expect(body.queryByRole("option", {
      name: "🍽️ 餐饮"
    })).not.toBeInTheDocument();
    await userEvent.click(body.getByRole("option", {
      name: "💰 收入"
    }));
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "新增表单确认分类图标",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "新增分类"
    }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole("button", {
      name: "选择图标"
    }));
    const picker = within(body.getByRole("dialog", {
      name: "选择图标"
    }));
    await userEvent.click(picker.getByRole("button", {
      name: "选择面条图标"
    }));
    await userEvent.click(picker.getByRole("button", {
      name: "确定"
    }));
    await expect(body.getByLabelText("当前分类图标：🍜")).toBeVisible();
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "没有上级分类候选",
  args: {
    parentOptions: []
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "新增分类"
    }));
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "新增弹窗等宽按钮",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "新增分类"
    }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));
    const cancel = dialog.getByRole("button", {
      name: "取消"
    });
    const submit = dialog.getByRole("button", {
      name: "新增分类"
    });
    await expect(cancel.getBoundingClientRect().width).toBeCloseTo(submit.getBoundingClientRect().width, 0);
    await expect(cancel.getBoundingClientRect().top).toBe(submit.getBoundingClientRect().top);
  }
}`,...h.parameters?.docs?.source}}},g=[`Default`,`IncomeChild`,`SelectedIcon`,`EmptyParentOptions`,`DialogButtons`]}))();export{d as Default,h as DialogButtons,m as EmptyParentOptions,f as IncomeChild,p as SelectedIcon,g as __namedExportsOrder,u as default};