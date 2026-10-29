import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./transactionStepFlowStoryUtils-Dv3X4aJQ.js";import{n as o,r as s,t as c}from"./transactionStepFlow-DP1iBwKn.js";import{n as l,t as u}from"./AccountStep-KCfyImzV.js";var d,f,p,m,h,g,_,v,y,b,x,S;t((()=>{d=r(),f=e(n()),a(),s(),l(),{userEvent:p,within:m}=__STORYBOOK_MODULE_TEST__,h={title:`Organisms/Transactions/AccountStep`,component:u,decorators:i,args:c,render:function(e){let[t,n]=(0,f.useState)(e.selectedAccount);return(0,d.jsx)(u,{...e,selectedAccount:t,onSelect:n})}},g={name:`收支账户有推荐`},_={name:`商家没有记录`,args:{recommendedAccountIds:[]}},v={name:`没有收支账户`,args:{accounts:[]}},y={name:`已选账户`,args:{selectedAccount:o.accounts[1]}},b={name:`换币种确认`,args:{...y.args,hasDetails:!0},play:async({canvasElement:e})=>{await p.click(m(e.ownerDocument.body).getByRole(`radio`,{name:`招商银行卡 CNY`}))}},x={name:`共同持有人与未指定持有人`,args:{accounts:[{...o.accounts[0],holders:[{display_name:`我`},{display_name:`妻子`}]},{...o.accounts[1],holders:[{display_name:`奶奶`}]},{...o.accounts[2],holders:[]}]}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "收支账户有推荐"
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "商家没有记录",
  args: {
    recommendedAccountIds: []
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "没有收支账户",
  args: {
    accounts: []
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "已选账户",
  args: {
    selectedAccount: flowFixture.accounts[1]
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "换币种确认",
  args: {
    ...SelectedAccount.args,
    hasDetails: true
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("radio", {
      name: "招商银行卡 CNY"
    }));
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "共同持有人与未指定持有人",
  args: {
    accounts: [{
      ...flowFixture.accounts[0],
      holders: [{
        display_name: "我"
      }, {
        display_name: "妻子"
      }]
    }, {
      ...flowFixture.accounts[1],
      holders: [{
        display_name: "奶奶"
      }]
    }, {
      ...flowFixture.accounts[2],
      holders: []
    }]
  }
}`,...x.parameters?.docs?.source}}},S=[`RecommendedAccounts`,`NoHistory`,`EmptyAccounts`,`SelectedAccount`,`CurrencyConfirmation`,`MultipleAndUnassignedHolders`]}))();export{b as CurrencyConfirmation,v as EmptyAccounts,x as MultipleAndUnassignedHolders,_ as NoHistory,g as RecommendedAccounts,y as SelectedAccount,S as __namedExportsOrder,h as default};