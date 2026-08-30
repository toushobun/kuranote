import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Stack-DRbcmy6F.js";import{n as i,t as a}from"./Box-aifjqslc.js";import{n as o,t as s}from"./Divider-p-DYx3Qb.js";import{n as c,t as l}from"./TransactionRow-wUQv4ZhE.js";var u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V;e((()=>{u=t(),a(),s(),r(),c(),d={id:`00000000-0000-4000-8000-000000009001`,type:`expense`,transaction_at:`2026-06-05T10:30:00.000Z`,amount:`2858`,account_name:`💴 日元现金`,account_currency:`JPY`,categoryItems:[{amount:`1280`,categoryName:`🥬 做饭食材/调料`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`},{amount:`498`,categoryName:`🧃 饮料`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`},{amount:`324`,categoryName:`🍿 零食`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`},{amount:`756`,categoryName:`🧴 日常用品`,parentCategoryName:`🏠 生活用品`,categoryType:`expense`}],merchant_name:`業務スーパー`,merchant_icon_url:null,note:`猪肉・鸡腿・蔬菜`,recorder_name:`淞文`},f={id:`00000000-0000-4000-8000-000000009016`,type:`income`,transaction_at:`2026-06-01T00:00:00.000Z`,amount:`323000`,account_name:`💴 日元现金`,account_currency:`JPY`,categoryItems:[{amount:`280000`,categoryName:`💴 工资`,parentCategoryName:`💰 工资收入`,categoryType:`income`},{amount:`15000`,categoryName:`💼 职务手当`,parentCategoryName:`💰 工资收入`,categoryType:`income`},{amount:`20000`,categoryName:`🏠 住房手当`,parentCategoryName:`💰 工资收入`,categoryType:`income`},{amount:`8000`,categoryName:`🚃 通勤手当`,parentCategoryName:`💰 工资收入`,categoryType:`income`}],merchant_name:`株式会社共逹`,merchant_icon_url:null,note:null,recorder_name:null},p={incomeLinkRole:`refund`,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:null},m={incomeLinkRole:`reimbursement`,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:null},h={...f,amount:`35000`,categoryItems:[{amount:`15000`,businessStatus:p,categoryName:`退款收入`,parentCategoryName:`其他收入`,categoryType:`income`},{amount:`20000`,businessStatus:m,categoryName:`报销收入`,parentCategoryName:`其他收入`,categoryType:`income`}],merchant_name:`关联收入`},g={id:`00000000-0000-4000-8000-000000009003`,type:`transfer`,transaction_at:`2026-06-02T12:54:00.000Z`,amount:`50000`,account_name:`💴 日元现金 → 🏦 储蓄账户`,account_currency:`JPY`,categoryItems:[],merchant_name:null,merchant_icon_url:null,note:null,recorder_name:`淞文`},_={title:`Molecules/Transactions/TransactionRow`,component:l,decorators:[e=>(0,u.jsx)(i,{sx:{bgcolor:`common.white`,minHeight:`100vh`},children:(0,u.jsx)(e,{})})],args:{item:d,receiptCard:!0,showAccount:!0,showRecorder:!0,showTime:!0}},v={name:`普通支出`},y={name:`收入记录`,args:{item:f}},b={name:`退款与报销业务标签`,args:{item:h}},x={name:`有无业务标签时的徽章高度对比`,render:()=>{let e={...d,amount:`220`,categoryItems:[{amount:`220`,categoryName:`🎫 JR地铁公交`,parentCategoryName:`🚃 交通`,categoryType:`expense`}],merchant_name:`JR`,note:null},t={...e,id:`00000000-0000-4000-8000-000000009002`,categoryItems:[{...e.categoryItems[0],businessStatus:m}]};return(0,u.jsxs)(n,{divider:(0,u.jsx)(o,{}),children:[(0,u.jsx)(l,{item:e,receiptCard:!0,showTime:!0}),(0,u.jsx)(l,{item:t,receiptCard:!0,showTime:!0})]})}},S={name:`结算状态与退款报销核销构成`,args:{item:{...d,amount:`0`,originalAmount:`2858`,categoryItems:[{...d.categoryItems[0],amount:`2858`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`858`,reimbursementAmount:`2000`},settlementStatus:`reimbursed`}}]}}},C={name:`多明细按维度汇总核销构成`,args:{item:{...d,categoryItems:[{...d.categoryItems[0],businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`40`,reimbursementAmount:`0`},settlementStatus:`pendingReimbursement`}},{...d.categoryItems[1],businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`60`,reimbursementAmount:`300`},settlementStatus:`pendingReimbursement`}}]}}},w={name:`单条明细部分已核销`,args:{item:{...d,amount:`1658`,originalAmount:`2858`,categoryItems:[{...d.categoryItems[0],businessNetAmount:`80`},...d.categoryItems.slice(1)]}}},T={name:`部分明细不计入支出`,args:{item:{...d,amount:`1578`,originalAmount:`2858`,categoryItems:[{...d.categoryItems[0],businessNetAmount:`0`},...d.categoryItems.slice(1)]}}},E={name:`完全抵消的退款收入（净额与原金额）`,args:{item:{...h,amount:`0`,originalAmount:`15000`,categoryItems:h.categoryItems.slice(0,1).map(e=>({...e,businessNetAmount:`0`}))}}},D={name:`完全抵消的报销收入（净额与原金额）`,args:{item:{...h,amount:`0`,originalAmount:`20000`,categoryItems:h.categoryItems.slice(1).map(e=>({...e,businessNetAmount:`0`}))}}},O={name:`转账记录`,args:{item:g}},k={name:`第二行全部为空`,args:{item:{...d,recorder_name:null},showAccount:!1,showRecorder:!1,showTime:!1}},A={name:`无商家`,args:{item:{...d,merchant_name:null,merchant_icon_url:null}}},j={name:`金额为 0`,args:{item:{...d,amount:`0`,categoryItems:[{amount:`0`,categoryName:`💸 金额调整`,parentCategoryName:`📋 其他`,categoryType:`expense`}]}}},M={name:`未来日期`,args:{item:{...d,transaction_at:`2026-12-31T14:30:00.000Z`}}},N={name:`小分类 2 项`,args:{item:{...d,amount:`656`,categoryItems:[{amount:`498`,categoryName:`🍱 便当`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`},{amount:`158`,categoryName:`🧃 饮料`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`}]}}},P={name:`小分类 3 项`,args:{item:{...d,amount:`1162`,categoryItems:[{amount:`645`,categoryName:`🥬 做饭食材/调料`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`},{amount:`328`,categoryName:`🍎 水果`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`},{amount:`189`,categoryName:`🍿 零食`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`}]}}},F={name:`小分类 4 项以上（净支出）`,args:{item:{...d}}},I={name:`混合收支（净收入）`,args:{item:{...f,amount:`278800`,categoryItems:[{amount:`1200`,categoryName:`🍜 外食`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`},{amount:`280000`,categoryName:`💴 工资`,parentCategoryName:`💰 工资收入`,categoryType:`income`}]}}},L={name:`小分类 4 项以上（净收入）`,args:{item:{...f}}},R={name:`商家名与金额对齐及元信息行间距对比`,render:()=>(0,u.jsxs)(n,{divider:(0,u.jsx)(o,{}),children:[(0,u.jsx)(l,{item:{...d,originalAmount:`3000`},receiptCard:!1,showAccount:!0,showRecorder:!0,showTime:!0}),(0,u.jsx)(l,{item:{...d,originalAmount:`3000`},receiptCard:!0,showAccount:!0,showRecorder:!0,showTime:!0})]})},z={name:`商家名到元信息行间距对比`,render:()=>{let e={...d,amount:`1578`,originalAmount:`2858`,categoryItems:[{...d.categoryItems[0],businessNetAmount:`0`},...d.categoryItems.slice(1)]},t={...d,account_name:`💴 很长的家庭共同日元现金账户名称`,recorder_name:`名字很长的家庭成员淞文`},r=[d,e,t,{...e,account_name:t.account_name,recorder_name:t.recorder_name}];return(0,u.jsx)(n,{divider:(0,u.jsx)(o,{}),children:r.map(e=>(0,u.jsx)(l,{item:e,receiptCard:!1,showAccount:!0,showRecorder:!0,showTime:!0},`${e.id}-${e.originalAmount??`ordinary`}-${e.account_name}`))})}},B={name:`长商家名 / 长备注`,args:{item:{...d,merchant_name:`非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的商家名称便利店`,note:`这是一条非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的备注内容`}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "普通支出"
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "收入记录",
  args: {
    item: incomeItem
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "退款与报销业务标签",
  args: {
    item: businessStatusItem
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "有无业务标签时的徽章高度对比",
  render: () => {
    const categoryOnlyItem: TransactionRowItem = {
      ...expenseItem,
      amount: "220",
      categoryItems: [{
        amount: "220",
        categoryName: "🎫 JR地铁公交",
        parentCategoryName: "🚃 交通",
        categoryType: "expense"
      }],
      merchant_name: "JR",
      note: null
    };
    const businessBadgeItem: TransactionRowItem = {
      ...categoryOnlyItem,
      id: "00000000-0000-4000-8000-000000009002",
      categoryItems: [{
        ...categoryOnlyItem.categoryItems[0],
        businessStatus: reimbursementStatus
      }]
    };
    return <Stack divider={<Divider />}>
        <TransactionRow item={categoryOnlyItem} receiptCard showTime />
        <TransactionRow item={businessBadgeItem} receiptCard showTime />
      </Stack>;
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "结算状态与退款报销核销构成",
  args: {
    item: {
      ...expenseItem,
      amount: "0",
      originalAmount: "2858",
      categoryItems: [{
        ...expenseItem.categoryItems[0],
        amount: "2858",
        businessStatus: {
          incomeLinkRole: null,
          offsetComposition: {
            refundAmount: "858",
            reimbursementAmount: "2000"
          },
          settlementStatus: "reimbursed"
        }
      }]
    }
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "多明细按维度汇总核销构成",
  args: {
    item: {
      ...expenseItem,
      categoryItems: [{
        ...expenseItem.categoryItems[0],
        businessStatus: {
          incomeLinkRole: null,
          offsetComposition: {
            refundAmount: "40",
            reimbursementAmount: "0"
          },
          settlementStatus: "pendingReimbursement"
        }
      }, {
        ...expenseItem.categoryItems[1],
        businessStatus: {
          incomeLinkRole: null,
          offsetComposition: {
            refundAmount: "60",
            reimbursementAmount: "300"
          },
          settlementStatus: "pendingReimbursement"
        }
      }]
    }
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "单条明细部分已核销",
  args: {
    item: {
      ...expenseItem,
      amount: "1658",
      originalAmount: "2858",
      categoryItems: [{
        ...expenseItem.categoryItems[0],
        businessNetAmount: "80"
      }, ...expenseItem.categoryItems.slice(1)]
    }
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "部分明细不计入支出",
  args: {
    item: {
      ...expenseItem,
      amount: "1578",
      originalAmount: "2858",
      categoryItems: [{
        ...expenseItem.categoryItems[0],
        businessNetAmount: "0"
      }, ...expenseItem.categoryItems.slice(1)]
    }
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "完全抵消的退款收入（净额与原金额）",
  args: {
    item: {
      ...businessStatusItem,
      amount: "0",
      originalAmount: "15000",
      categoryItems: businessStatusItem.categoryItems.slice(0, 1).map(item => ({
        ...item,
        businessNetAmount: "0"
      }))
    }
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "完全抵消的报销收入（净额与原金额）",
  args: {
    item: {
      ...businessStatusItem,
      amount: "0",
      originalAmount: "20000",
      categoryItems: businessStatusItem.categoryItems.slice(1).map(item => ({
        ...item,
        businessNetAmount: "0"
      }))
    }
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "转账记录",
  args: {
    item: transferItem
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "第二行全部为空",
  args: {
    item: {
      ...expenseItem,
      recorder_name: null
    },
    showAccount: false,
    showRecorder: false,
    showTime: false
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "无商家",
  args: {
    item: {
      ...expenseItem,
      merchant_name: null,
      merchant_icon_url: null
    }
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "金额为 0",
  args: {
    item: {
      ...expenseItem,
      amount: "0",
      categoryItems: [{
        amount: "0",
        categoryName: "💸 金额调整",
        parentCategoryName: "📋 其他",
        categoryType: "expense"
      }]
    }
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "未来日期",
  args: {
    item: {
      ...expenseItem,
      transaction_at: "2026-12-31T14:30:00.000Z"
    }
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "小分类 2 项",
  args: {
    item: {
      ...expenseItem,
      amount: "656",
      categoryItems: [{
        amount: "498",
        categoryName: "🍱 便当",
        parentCategoryName: "🍽️ 饮食",
        categoryType: "expense"
      }, {
        amount: "158",
        categoryName: "🧃 饮料",
        parentCategoryName: "🍽️ 饮食",
        categoryType: "expense"
      }]
    }
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: "小分类 3 项",
  args: {
    item: {
      ...expenseItem,
      amount: "1162",
      categoryItems: [{
        amount: "645",
        categoryName: "🥬 做饭食材/调料",
        parentCategoryName: "🍽️ 饮食",
        categoryType: "expense"
      }, {
        amount: "328",
        categoryName: "🍎 水果",
        parentCategoryName: "🍽️ 饮食",
        categoryType: "expense"
      }, {
        amount: "189",
        categoryName: "🍿 零食",
        parentCategoryName: "🍽️ 饮食",
        categoryType: "expense"
      }]
    }
  }
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "小分类 4 项以上（净支出）",
  args: {
    item: {
      ...expenseItem
    }
  }
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: "混合收支（净收入）",
  args: {
    item: {
      ...incomeItem,
      amount: "278800",
      categoryItems: [{
        amount: "1200",
        categoryName: "🍜 外食",
        parentCategoryName: "🍽️ 饮食",
        categoryType: "expense"
      }, {
        amount: "280000",
        categoryName: "💴 工资",
        parentCategoryName: "💰 工资收入",
        categoryType: "income"
      }]
    }
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  name: "小分类 4 项以上（净收入）",
  args: {
    item: {
      ...incomeItem
    }
  }
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  name: "商家名与金额对齐及元信息行间距对比",
  render: () => <Stack divider={<Divider />}>
      {/* 同时覆盖真实明细列表的 15px 金额和小票卡片的 18px 金额，
          用于核对第一行文字基线及第一行到 meta 行的垂直间距。 */}
      <TransactionRow item={{
      ...expenseItem,
      originalAmount: "3000"
    }} receiptCard={false} showAccount showRecorder showTime />
      <TransactionRow item={{
      ...expenseItem,
      originalAmount: "3000"
    }} receiptCard showAccount showRecorder showTime />
    </Stack>
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  name: "商家名到元信息行间距对比",
  render: () => {
    const adjustedItem: TransactionRowItem = {
      ...expenseItem,
      amount: "1578",
      originalAmount: "2858",
      categoryItems: [{
        ...expenseItem.categoryItems[0],
        businessNetAmount: "0"
      }, ...expenseItem.categoryItems.slice(1)]
    };
    const longMetaItem: TransactionRowItem = {
      ...expenseItem,
      account_name: "💴 很长的家庭共同日元现金账户名称",
      recorder_name: "名字很长的家庭成员淞文"
    };
    const comparisonItems: TransactionRowItem[] = [expenseItem, adjustedItem, longMetaItem, {
      ...adjustedItem,
      account_name: longMetaItem.account_name,
      recorder_name: longMetaItem.recorder_name
    }];
    return <Stack divider={<Divider />}>
        {comparisonItems.map(item => <TransactionRow item={item} key={\`\${item.id}-\${item.originalAmount ?? "ordinary"}-\${item.account_name}\`} receiptCard={false} showAccount showRecorder showTime />)}
      </Stack>;
  }
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  name: "长商家名 / 长备注",
  args: {
    item: {
      ...expenseItem,
      merchant_name: "非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的商家名称便利店",
      note: "这是一条非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的备注内容"
    } as TransactionRowItem
  }
}`,...B.parameters?.docs?.source}}},V=[`ExpenseFull`,`Income`,`BusinessStatuses`,`BusinessBadgeHeightComparison`,`MixedOffsetSettlement`,`AggregatedOffsetComposition`,`PartiallyOffset`,`PartiallyExcluded`,`FullyOffsetRefundIncome`,`FullyOffsetReimbursementIncome`,`Transfer`,`NoMetaRow`,`NoMerchant`,`ZeroAmount`,`FutureDate`,`TwoCategories`,`ThreeCategories`,`ManyExpenseCategories`,`MixedIncomeNet`,`ManyIncomeCategories`,`TitleAlignmentAndMetaSpacingComparison`,`MerchantToMetaGapComparison`,`LongText`]}))();export{C as AggregatedOffsetComposition,x as BusinessBadgeHeightComparison,b as BusinessStatuses,v as ExpenseFull,E as FullyOffsetRefundIncome,D as FullyOffsetReimbursementIncome,M as FutureDate,y as Income,B as LongText,F as ManyExpenseCategories,L as ManyIncomeCategories,z as MerchantToMetaGapComparison,I as MixedIncomeNet,S as MixedOffsetSettlement,A as NoMerchant,k as NoMetaRow,T as PartiallyExcluded,w as PartiallyOffset,P as ThreeCategories,R as TitleAlignmentAndMetaSpacingComparison,O as Transfer,N as TwoCategories,j as ZeroAmount,V as __namedExportsOrder,_ as default};