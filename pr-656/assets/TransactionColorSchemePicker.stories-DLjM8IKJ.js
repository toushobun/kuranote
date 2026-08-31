import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-ZVX_L6gb.js";import{n as i,t as a}from"./TransactionColorSchemePicker-KQoWb7pt.js";var o,s,c,l,u;e((()=>{o=t(),n(),i(),s={title:`Molecules/Theme/TransactionColorSchemePicker`,component:a,decorators:[e=>(0,o.jsx)(r,{storageScope:`storybook-transaction-colors`,children:(0,o.jsx)(`div`,{style:{maxWidth:360,padding:16},children:(0,o.jsx)(e,{})})})],args:{action:async(e,t)=>({success:`收支配色方案已保存。`,transactionColorScheme:t.get(`transactionColorScheme`)})}},c={name:`支出绿 / 收入红（默认）`},l={name:`支出红 / 收入绿`,decorators:[e=>(0,o.jsx)(r,{initialTransactionColorScheme:`expense_red_income_green`,storageScope:`storybook-transaction-colors-expense-red`,children:(0,o.jsx)(e,{})})]},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "支出绿 / 收入红（默认）"
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "支出红 / 收入绿",
  decorators: [Story => <UserThemeProvider initialTransactionColorScheme="expense_red_income_green" storageScope="storybook-transaction-colors-expense-red">
        <Story />
      </UserThemeProvider>]
}`,...l.parameters?.docs?.source}}},u=[`Default`,`ExpenseRed`]}))();export{c as Default,l as ExpenseRed,u as __namedExportsOrder,s as default};