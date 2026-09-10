import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-D_-TqKgK.js";import{n as i,t as a}from"./CategoryForm-DqcSjewo.js";var o,s,c,l,u,d,f,p,m;e((()=>{o=t(),n(),i(),{expect:s,userEvent:c,within:l}=__STORYBOOK_MODULE_TEST__,u={title:`Organisms/Categories/CategoryForm`,component:a,decorators:[e=>(0,o.jsx)(r,{storageScope:`storybook-category-dialog`,children:(0,o.jsx)(e,{})})],args:{createCategoryAction:async()=>{},parentOptions:[{id:`expense-food`,name:`🍽️ 餐饮`,type:`expense`},{id:`expense-transport`,name:`🚃 交通`,type:`expense`},{id:`income-main`,name:`💰 收入`,type:`income`}]}},d={name:`新增分类弹窗`},f={name:`没有上级分类候选`,args:{parentOptions:[]}},p={name:`弹窗等宽按钮与归档样式`,play:async({canvasElement:e})=>{await c.click(l(e).getByRole(`button`,{name:`新增分类`}));let t=l(await l(e.ownerDocument.body).findByRole(`dialog`)),n=t.getByRole(`button`,{name:`取消`}),r=t.getByRole(`button`,{name:`新增分类`});await s(n.getBoundingClientRect().width).toBeCloseTo(r.getBoundingClientRect().width,0),await s(n.getBoundingClientRect().top).toBe(r.getBoundingClientRect().top)}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "新增分类弹窗"
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "没有上级分类候选",
  args: {
    parentOptions: []
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "弹窗等宽按钮与归档样式",
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
}`,...p.parameters?.docs?.source}}},m=[`Default`,`EmptyParentOptions`,`DialogButtons`]}))();export{d as Default,p as DialogButtons,f as EmptyParentOptions,m as __namedExportsOrder,u as default};