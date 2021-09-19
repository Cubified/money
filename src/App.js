/*eslint no-restricted-globals: 0*/

import { useState, useEffect } from 'react';

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AppBar,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  ThemeProvider,
  Toolbar,
  Typography
} from '@material-ui/core';

import { createTheme } from '@material-ui/core/styles';

import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
} from '@material-ui/pickers';

import {
  Autocomplete
} from '@material-ui/lab';

import {
  AccountBalance,
  Atm,
  AttachMoney,
  ChevronLeft,
  ChevronRight,
  CloudDone,
  CreditCard,
  Delete,
  Edit,
  ExpandMore,
  Person,
  Restaurant,
  Flight,
  LocalGroceryStore,
  LocalGasStation,
  ShoppingCart
} from '@material-ui/icons';
import ListIcon from '@material-ui/icons/List';

import DateFnsUtils from '@date-io/date-fns';

import { AreaChart } from 'react-easy-chart';
import { PieChart } from 'react-minimal-pie-chart';
import ReactTooltip from 'react-tooltip';

import accounts_db from './accounts.js';

/*
 * CONSTS
 */
const MOBILE_CUTOFF = 800;

/*
 * GLOBAL UTILS
 */

function format_money(money, no_decimals){
  let out = '',
      str = money.toFixed(no_decimals ? 0 : 2).toString(),
      trail = (str.indexOf('.') > -1 ? str.substring(str.indexOf('.')) : '');

  str.split('').reverse().forEach((char, ind)=>{
    if(char === '-') return;
    if(ind % 3 === 0 && ind > trail.length){
      out += ',';
    }
    out += char;
  });
  out = out.split('').reverse().join('');

  out = `$${out}`;
  if(money < 0) out = `(${out})`;

  return out;
}

function format_date(datestr){
  let date = new Date(datestr);
  return `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`;
}

function collapse_object(obj){
  let out = [];

  for(let key in obj){
    out.push(...obj[key]);
  }

  return out;
}

function sum_all(arr, prop, cmp){
  let initial = {};
  initial[prop] = 0;
  return arr.reduce((prev, next) => {
    let out = {};
    out[prop] = prev[prop];
    if(cmp(next)) out[prop] += next[prop];
    return out;
  }, initial)[prop];
}

function string_to_color(str){
  let hash = 0, i;
  for(i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for(i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

function in_range(val, min, max){
  return (val >= min && val <= max);
}

function local_storage_get(key){
  if(localStorage.getItem(key)) return JSON.parse(localStorage.getItem(key));
}

function is_same_day(a, b){
  let date_a = new Date(a),
    date_b = new Date(b);
  return (date_a.getMonth() === date_b.getMonth() &&
    date_a.getDate() === date_b.getDate() &&
    date_a.getFullYear() === date_b.getFullYear());
}

function conforms_to_timescale(date, timescale){
  const TIMESCALE_MONTH = 0,
    TIMESCALE_YTD = 1;
  // TIMESCALE_ALL = 2;

  let today = new Date();

  switch(timescale){
    case TIMESCALE_MONTH:
      return date.getMonth() === today.getMonth();
    case TIMESCALE_YTD:
      return date.getFullYear() === today.getFullYear();
    default:
      return true;
  }
}

/*
 * GENERIC CLASSES
 */

class Account {
  constructor(type, obj, date, balance){
    this.id = (Math.random()*10000).toString();

    this.type = type;
    this.issuer = obj.issuer;
    this.name = obj.name;
    this.date = (this.type === 'Credit Card' ? date : undefined);
    this.props = obj;
    this.balance = balance;
  }
}

class Transaction {
  constructor(date, name, category, account, paymentAccount, amount){
    this.id = (Math.random()*10000).toString();
    this.update(date, name, category, account, paymentAccount, amount);
  }
  update(date, name, category, account, paymentAccount, amount){
    this.date = date;
    this.name = name;
    this.category = category;
    this.account = account;
    this.paymentAccount = (this.category === 'Payment' ? paymentAccount : undefined);
    this.amount = amount;
  }
}

class BudgetItem {
  constructor(name, amount, categories, account){
    this.id = (Math.random()*10000).toString();

    this.update(name, amount, categories, account);
  }
  update(name, amount, categories, account){
    this.name = name;
    this.amount = amount;
    this.categories = categories;
    this.account = account;
  }
}

/*
 * COMPONENTS
 */
  /*
function Spacer(){
  return (
    <>
      &nbsp;
    </>
  );
}*/

function View({ number, view, children }){
  return (
    <div style={view===number ? {} : {display:'none',visibility:'hidden'}}>
      {children}
    </div>
  );
}

function NavigationController({ view, setView }){
  const [drawerOpen, setDrawerOpen] = useState(false);

  const viewNames = [
    "Accounts",
    "Overview",
    "Transactions",
    "Simulator",
    "Budget"
  ];
  const viewIcons = [
    (<Person />),
    (<ListIcon />),
    (<AccountBalance />),
    (<CreditCard />),
    (<AttachMoney />)
  ];
  const viewRequirements = [
    window.innerWidth <= MOBILE_CUTOFF,
    true,
    true,
    true,
    true
  ];

  return (
    <>
      <AppBar position="static" className="appbar">
        <Toolbar>
          <img src="/money/build/logo.svg" alt="Money" height={48} />
          <Typography variant="h6" className="appbar-head">
            
          </Typography>
          {
            (window.innerWidth > MOBILE_CUTOFF ? (
              <div>
                <Tabs
                  value={view}
                  onChange={(e, n) => setView(n)}
                  centered>
                  {
                    viewNames.map((el, ind) => (
                      <Tab key={ind} label={el} style={viewRequirements[ind] ? {} : {display:'none',visibility:'hidden',opacity:0}} />
                    ))
                  }
                </Tabs>
              </div>
            ) : (
              <div>
                <Button variant="outlined" color="inherit" onClick={() => setDrawerOpen(true) }>{viewNames[view]}</Button>
                <Drawer anchor="top" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                  <List>
                    {
                      viewNames.map((el, ind) => (
                        <ListItem key={ind} button onClick={() => { setView(ind); setDrawerOpen(false); }} style={viewRequirements[ind] ? {} : {display:'none',visibility:'hidden',opacity:0}}>
                          <ListItemIcon>{viewIcons[ind]}</ListItemIcon>
                          <ListItemText>{el}</ListItemText>
                        </ListItem>
                      ))
                    }
                  </List>
                </Drawer>
              </div>
            ))
          }
          <div className="appbar-tail">
            <CloudDone data-tip="Data saved locally." />
          </div>
        </Toolbar>
      </AppBar>
    </>
  );
}

function AccountDialog({ isOpen, addAccount, close }){
  const [accountType, setAccountType] = useState('Checking'),
    [account, setAccount] = useState(),
    [statementDate, setStatementDate] = useState(new Date()),
    [accountError, setAccountError] = useState(false),
    [genericAccountIssuer, setGenericAccountIssuer] = useState(),
    [genericAccountName, setGenericAccountName] = useState(),
    [accountBalance, setAccountBalance] = useState();

  useEffect(() => {
    if(!isOpen){
      setTimeout(() => {
        setAccountType('Checking');
        setAccount();
        setStatementDate(new Date());
        setAccountError(false);
        setGenericAccountIssuer();
        setGenericAccountName();
        setAccountBalance();
      }, 500);
    }
  }, [isOpen]);

  function valid(){
    let out = true;

    if(!account){
      setAccountError(true);
      out = false;
    }

    return out;
  }

  function add_if_valid(callback){
    if(valid()){
      let account_cpy = JSON.parse(JSON.stringify(account));
      if(account.issuer === 'Other' &&
         account.name.indexOf('Generic') > -1){
        account_cpy.issuer = (!genericAccountIssuer || genericAccountIssuer.trim() === '' ? account_cpy.issuer : genericAccountIssuer);
        account_cpy.name = (!genericAccountName || genericAccountName.trim() === '' ? account_cpy.name : genericAccountName);
      }
      addAccount(accountType, account_cpy, statementDate, parseFloat(accountBalance) || 0);
      callback();
    }
  }

  return (
    <Dialog open={isOpen} onClose={close}>
      <DialogTitle>Add an Account</DialogTitle>
      <DialogContent style={{width: '65vw', maxWidth: '400px'}}>
        <DialogContentText>
          <FormControl variant="outlined" className="fullwidth">
            <InputLabel id="account-type-label">Account type</InputLabel>
            <Select
              variant="outlined"
              label="Account type"
              labelId="account-type-label"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value) }
              fullWidth>
              <MenuItem value="Checking">Checking</MenuItem>
              <MenuItem value="Credit Card">Credit Card</MenuItem>
              <MenuItem value="Savings">Savings</MenuItem>
              <MenuItem value="Investment">Investment</MenuItem>
              <MenuItem value="Loan">Loan</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
          <br />
          <br />
          <Autocomplete
            options={collapse_object(accounts_db[accountType]).sort((a, b) => {if(a.issuer==='Other') return 1; else if(b.issuer==='Other') return -1; else return -b.issuer.localeCompare(a.issuer)})}
            getOptionLabel={(option) => { return (option.issuer==='Other'?'':option.issuer + ' ') + option.name }}
            groupBy={(option) => option.issuer}
            renderInput={(params) =>
              <TextField
                {...params}
                label="Account name"
                variant="outlined"
                error={accountError}
                helperText={accountError ? 'Please select an option.' : ''}
              />
            }
            onChange={(e, n) => { setAccountError(false); setAccount(n); }}
          />
          <br />
          {
            (accountType === 'Credit Card' ? (
              <>
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                  <KeyboardDatePicker
                    disableToolbar
                    variant="inline"
                    format="MM/dd/yyyy"
                    label="Next Statement Date"
                    value={statementDate}
                    onChange={setStatementDate}
                    fullWidth
                  />
                </MuiPickersUtilsProvider>
                <br />
                <br />
              </>
            ) : (<></>))
          }
          {
            (account && account.issuer === 'Other' && account.name.indexOf('Generic') > -1 ? (
              <>
                <TextField
                  variant="outlined"
                  label="Account Issuer (Optional)"
                  fullWidth
                  value={genericAccountIssuer}
                  onChange={(e) => setGenericAccountIssuer(e.target.value)}
                />
                <br />
                <br />
                <TextField
                  variant="outlined"
                  label="Account Name (Optional)"
                  fullWidth
                  value={genericAccountName}
                  onChange={(e) => setGenericAccountName(e.target.value)}
                />
                <br />
                <br />
              </>
            ) : (<></>))
          }
          <TextField
            variant="outlined"
            type="number"
            label="Balance (optional)"
            fullWidth
            value={accountBalance}
            onChange={(e) => setAccountBalance(e.target.value)}
          />
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="primary" onClick={() => add_if_valid(close) }>Add</Button>
      </DialogActions>
    </Dialog>
  );
}

function TransactionDialog({ isOpen, accounts, setAccounts, addTransaction, close, transRef, setTransRef }){
  const [date, setDate] = useState(new Date()),
    [name, setName] = useState(''),
    [category, setCategory] = useState('Restaurants'),
    [account, setAccount] = useState(),
    [paymentAccount, setPaymentAccount] = useState(),
    [amount, setAmount] = useState(),
    [makeDefault, setMakeDefault] = useState(false);

  const [nameError, setNameError] = useState(false),
    [amountError, setAmountError] = useState(false),
    [paymentAccountError, setPaymentAccountError] = useState(false);

  function valid(){
    let out = true;
    if(name.trim() === ''){
      setNameError(true);
      out = false;
    }
    if(!amount){
      setAmountError(true);
      out = false;
    }
    if(category === 'Payment' && paymentAccount === account){
      setPaymentAccountError(true);
      out = false;
    }
    return out;
  }

  function do_make_default(){
    let tmp = accounts.slice();
    tmp = [
      accounts.find(el => el.id === account),
      ...tmp.filter(el => el.id !== account)
    ];
    setAccounts(tmp);
  }

  useEffect(() => {
    if(isOpen && !transRef){
      setDate(new Date());
      setName('');
      setCategory('Restaurants');
      setAccount(accounts[0].id);
      setPaymentAccount(accounts[0].id);
      setAmount();
      setMakeDefault(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if(transRef){
      setDate(new Date(transRef.date));
      setName(transRef.name);
      setCategory(transRef.category);
      setAccount(transRef.account.id);
      if(transRef.category === 'Payment') setPaymentAccount(transRef.paymentAccount.id);
      setAmount(transRef.amount);
    }
  }, [transRef]);

  return (
    <Dialog open={isOpen} onClose={close}>
      <DialogTitle>Add a Transaction</DialogTitle>
      <DialogContent style={{width: '65vw', maxWidth: '400px'}}>
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <KeyboardDatePicker
            disableToolbar
            variant="inline"
            format="MM/dd/yyyy"
            label="Date"
            value={date}
            onChange={setDate}
            fullWidth
          />
        </MuiPickersUtilsProvider>
        <br />
        <br />
        <TextField
          variant="outlined"
          label="Name"
          fullWidth
          error={nameError}
          helperText={nameError ? 'Please enter a name.' : ''}
          value={name}
          onChange={(e) => { setNameError(false); setName(e.target.value); }}
        />
        {
          (category === 'Starting Balance' ? (<></>) : (<>
            <br />
            <br />
            <FormControl variant="outlined" className="fullwidth">
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                variant="outlined"
                label="Category"
                label-id="category-label"
                value={category}
                onChange={(e) => setCategory(e.target.value) }
                fullWidth
              >
                  <MenuItem value="Restaurants">Restaurants</MenuItem>
                  <MenuItem value="Travel / Entertainment">Travel / Entertainment</MenuItem>
                  <MenuItem value="Groceries">Groceries</MenuItem>
                  <MenuItem value="Gas">Gas</MenuItem>
                  <MenuItem value="Online shopping">Online shopping</MenuItem>
                  <MenuItem value="Payment">Payment / Transfer</MenuItem>
                  <MenuItem value="Deposit / Withdrawal">Deposit / Withdrawal</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </>))
        }
        {
          (category === 'Payment' ? (
            <>
              <br />
              <br />
              <FormControl variant="outlined" className="fullwidth">
                <InputLabel id="payment-account-label">Source Account</InputLabel>
                <Select
                  variant="outlined"
                  label="Source Account"
                  label-id="payment-account-label"
                  error={paymentAccountError}
                  helperText={paymentAccountError ? 'Source account cannot be the same as the account being paid off.' : ''}
                  value={paymentAccount}
                  onChange={(e) => { setPaymentAccountError(false); setPaymentAccount(e.target.value) }}
                  fullWidth
                >
                  {
                    accounts.map((acc, ind) => (
                      <MenuItem key={ind} value={acc.id}>{acc.issuer==='Other'?'':acc.issuer} {acc.name}</MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
            </>
          ) : (<></>))
        }
        <br />
        <br />
        <FormControl variant="outlined" className="fullwidth">
          <InputLabel id="account-label">{category === 'Payment' ? 'Destination' : ''} Account</InputLabel>
          <Select
            variant="outlined"
            label={category === 'Payment' ? "Destination Account" : "Account"}
            label-id="account-label"
            value={account}
            onChange={(e) => { setPaymentAccountError(false); setAccount(e.target.value) }}
            fullWidth
          >
            {
              accounts.map((acc, ind) => (
                <MenuItem key={ind} value={acc.id}>{acc.issuer==='Other'?'':acc.issuer} {acc.name}</MenuItem>
              ))
            }
          </Select>
        </FormControl>
        {
          (account !== accounts[0].id ? (<>
            <div className="flex-align-center">
              <Checkbox id="make-account-default" color="primary" checked={makeDefault} onChange={(e, n) => setMakeDefault(n)} />
              <InputLabel for="make-account-default">Make this account the default</InputLabel>
            </div>
          </>) : (<><br /><br /></>))
        }
        <TextField
          variant="outlined"
          type="number"
          label="Amount"
          error={amountError}
          helperText={amountError ? 'Please enter an amount.' : ''}
          fullWidth
          value={amount}
          onChange={(e) => { setAmountError(false); setAmount(e.target.value); }}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="secondary" onClick={() => { if(valid()) { if(makeDefault) { do_make_default(); } addTransaction(date, name, category, accounts.find(el => el.id === account), accounts.find(el => el.id === paymentAccount), parseFloat(amount)); close(); }}}>{transRef ? 'Update' : 'Add'}</Button>
      </DialogActions>
    </Dialog>
  );
}

function BudgetDialog({ accounts, isOpen, addBudgetItem, close, budgetItemRef, setBudgetItemRef }){
  const [name, setName] = useState(''),
        [amount, setAmount] = useState(),
        [categories, setCategories] = useState([]),
        [account, setAccount] = useState();

  const [nameError, setNameError] = useState(),
        [amountError, setAmountError] = useState(),
        [categoriesError, setCategoriesError] = useState();

  function valid(){
    let out = true;
    if(!name || name.trim() === ''){
      setNameError(true);
      out = false;
    }
    if(!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0){
      setAmountError(true);
      out = false;
    }
    if(!categories || categories.length === 0){
      setCategoriesError(true);
      out = false;
    }
    return out;
  }

  useEffect(() => {
    if(isOpen && !budgetItemRef){
      setName('');
      setAmount();
      setCategories([]);
      setAccount();
    }
  }, [isOpen]);

  useEffect(() => {
    if(budgetItemRef){
      setName(budgetItemRef.name);
      setAmount(budgetItemRef.amount);
      setCategories(budgetItemRef.categories);
      setAccount(budgetItemRef.account);
    }
  }, [budgetItemRef]);

  return (
    <Dialog open={isOpen} onClose={close}>
      <DialogTitle>Add a Budget Item</DialogTitle>
      <DialogContent style={{width: '65vw', maxWidth: '400px'}}>
        <TextField
          variant="outlined"
          label="Name"
          error={nameError}
          helperText={nameError ? 'Please enter a name.' : ''}
          value={name}
          onChange={(e) => { setNameError(); setName(e.target.value); }}
          fullWidth
        />
        <br />
        <br />
        <TextField
          variant="outlined"
          label="Monthly Amount"
          type="number"
          error={amountError}
          helperText={amountError ? 'Please enter an amount greater than zero.' : ''}
          value={amount}
          onChange={(e) => { setAmountError(); setAmount(e.target.value); }}
          fullWidth
        />
        <br />
        <br />
        <FormControl variant="outlined" className="fullwidth">
          <InputLabel id="budget-category-label">Categories</InputLabel>
          <Select
            variant="outlined"
            label="Categories"
            label-id="budget-category-label"
            error={categoriesError}
            value={categories}
            onChange={(e) => { setCategoriesError(); setCategories(e.target.value); }}
            fullWidth
            multiple
          >
            <MenuItem value="Restaurants">Restaurants</MenuItem>
            <MenuItem value="Travel / Entertainment">Travel / Entertainment</MenuItem>
            <MenuItem value="Groceries">Groceries</MenuItem>
            <MenuItem value="Gas">Gas</MenuItem>
            <MenuItem value="Online shopping">Online shopping</MenuItem>
            <MenuItem value="Payment">Payment</MenuItem>
            <MenuItem value="Deposit / Withdrawal">Withdrawal</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>
        {
          (categories.indexOf('Payment') > -1 ? (<>
            <br />
            <br />
            <FormControl variant="outlined" className="fullwidth">
              <InputLabel id="budget-payment-account-label">Account</InputLabel>
              <Select
                variant="outlined"
                label="Account"
                label-id="budget-payment-account-label"
                value={account}
                onChange={(e) => setAccount(e.target.value) }
                fullWidth
              >
                {
                  accounts.map((acc, ind) => (
                    <MenuItem key={ind} value={acc.id}>{acc.issuer==='Other'?'':acc.issuer} {acc.name}</MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </>) : (<></>))
        }
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="secondary" onClick={() => { if(valid()) { addBudgetItem(name, parseFloat(amount), categories, account); close(); }}}>{budgetItemRef ? 'Update' : 'Add'}</Button>
      </DialogActions>
    </Dialog>
  );
}

function TransactionList({ transactions, max, paginate, openTransactionDialog, removeTransaction }){
  const [page, setPage] = useState(0);

  const categoryIcons = {
    "Restaurants": (<Restaurant />),
    "Travel / Entertainment": (<Flight />),
    "Groceries": (<LocalGroceryStore />),
    "Gas": (<LocalGasStation />),
    "Online Shopping": (<ShoppingCart />),
    "Payment": (<CreditCard />),
    "Deposit / Withdrawal": (<Atm />),
    "Other": (<AttachMoney />),
    "Starting Balance": (<AttachMoney />)
  };

  return (
    <>
      {
        (transactions.length === 0 ? (
          <Typography variant="subtitle1" style={{textAlign:"center",marginBottom:'10px',color:'white'}}>
            No transactions yet recorded.
            <br />
            <i>To add an account, click the "+" button on the left panel.</i>
          </Typography>
        ) : (<></>))
      }
      {
        (paginate ? transactions.sort((a, b) => (new Date(b.date) - new Date(a.date))).slice(page*max, (page+1)*max) : transactions).map((trans, ind) => {
          if(ind > max) return (<div key={ind}></div>);
          return (<div key={ind}>
            <Card variant="outlined" className="flex-space-between pl-10">
                <div className="mr-10">
                  {categoryIcons[trans.category]}
                </div>
                <div className="flex-grow">
                  <Typography variant="overline">{format_date(trans.date)}</Typography>
                  <Typography variant="h6">{trans.name}</Typography>
                </div>
                <div className="text-align-right">
                  <Typography variant="h6">{format_money(trans.amount)}</Typography>
                  <Typography variant="overline">{trans.account.issuer==='Other'?'':trans.account.issuer} {trans.account.name}</Typography>
                </div>
                <div className="ml-10">
                  <IconButton onClick={() => openTransactionDialog(trans)}>
                    <Edit />
                  </IconButton>
                  <br />
                  <IconButton onClick={() => removeTransaction(trans)}>
                    <Delete />
                  </IconButton>
                </div>
            </Card>
            <br />
          </div>);
        })
      }
      { (paginate ? (
        <div className="flex-center">
          <IconButton onClick={() => setPage(page-1)} disabled={page===0}><ChevronLeft /></IconButton>
          <div style={{color:'white'}}>Page {page+1} of {Math.ceil(transactions.length/max)}</div>
          <IconButton onClick={() => setPage(page+1)} disabled={page===Math.ceil(transactions.length/max)-1}><ChevronRight /></IconButton>
        </div>) : (<></>))
      }
    </>
  );
}

function AccountsAccordion({ name, accounts }){
  if(accounts.length === 0) return (<></>);

  return (
    <Accordion square defaultExpanded className="accordion">
      <AccordionSummary className="accordion-summary" expandIcon={<ExpandMore />}>
        <Typography variant="h6" className="fs-13">{name}</Typography>
        <Typography variant="h6" className="fs-13">{format_money(accounts.reduce((prev, next) => {return {balance: prev.balance+next.balance}}, {balance:0}).balance, true)}</Typography>
      </AccordionSummary>
      <AccordionDetails className="no-margin no-padding">
        <div className="fullwidth">
          {
            accounts.map((account, ind) => {
              return (<div key={ind}>
                <div className="account">
                  {
                    (account.name.indexOf('Generic') === -1 ? (
                      <img src={account.props.image} width={96} height={60} className="account-image" />
                    ) : (<></>))
                  }
                  <div className="account-left flex-grow ml-10">
                    <Typography variant="h6" className="fs-11">{account.issuer === 'Other' ? account.name : account.issuer}</Typography>
                    <Typography variant="subtitle1" className="fs-9">{account.issuer === 'Other' ? name + ' Account' : account.name}</Typography>
                  </div>
                  <div className="account-right">
                    <Typography variant="h6" className="fs-11">{format_money(account.balance)}</Typography>
                  </div>
                </div>
                <Divider />
              </div>);
            })
          }
        </div>
      </AccordionDetails>
    </Accordion>
  );
}

function CardSimulator({ summary, accounts, transactions }){
  const [baseSize, setBaseSize] = useState(1);

  const categories = [
    "Restaurants",
    "Travel / Entertainment",
    "Groceries",
    "Gas",
    "Online shopping",
    "Other"
  ];
  const db = collapse_object(accounts_db['Credit Card']);

  function rewards(card, trans){
    let cat = trans.category;
    if(categories.indexOf(cat) === -1) return 0;
    if(cat === 'Travel / Entertainment') cat = 'Travel';
    return Math.abs(trans.amount * card[cat.toLowerCase()] * card.conversion);
  }

  function sort_cards_by_rewards(){
    let out = db.slice();
    out.forEach(card => {
      let tot = -card.fee;
      transactions.forEach(trans => {
        tot += rewards(card, trans);
      });
      card.total_rewards = tot;
    });
    return out.sort((a, b) => {
      return b.total_rewards-a.total_rewards;
    }).filter(el => el.total_rewards > 0);
  }

  function best_card_for_category(new_db, category){
    let total_spend = transactions.reduce((prev, next) => {
        if(next.category === category){
          return {
            amount: prev.amount + next.amount
          };
        }
        return {amount: prev.amount};
      }, {amount:0}).amount;

    return new_db.reduce((prev, next) => {
      if(rewards(next, {amount: total_spend, category}) >
         rewards(prev, {amount: total_spend, category})){
        return next;
      }
      return prev;
    }, accounts_db['Credit Card']['Other'][0]);
  }

  let new_db = sort_cards_by_rewards(),
    categories_by_spend = [],
    base = [];
  transactions.forEach(trans => {
    if(categories.indexOf(trans.category) > -1){
      let el = categories_by_spend.find(el => el.category === trans.category);
      if(el === undefined) categories_by_spend.push({category: trans.category, spend: trans.amount});
      else el.spend += trans.amount;
    }
  });
  categories_by_spend.sort((a, b) => (a.spend - b.spend));
  categories_by_spend.forEach(el => {
    let out = {...el, card: best_card_for_category(new_db, el.category)};
    out.rewards = rewards(out.card, {category: el.category, amount: el.spend});
    base.push(out);
  });
  base.sort((a, b) => (b.rewards-a.rewards));
  base = base.slice(0, baseSize);

  let total_af = base.reduce((prev, next) => { return {card: {fee: prev.card.fee+next.card.fee}}}, {card:{fee:0}}).card.fee;

  new_db = base.map(el => el.card);
  categories.forEach(cat => {
    if(!base.find(el => el.category === cat)){
      let out = {
        category: cat,
        card: best_card_for_category(new_db, cat)
      },
        spend = categories_by_spend.find(el => el.category === cat);
      if(spend === undefined) spend = 0;
      else spend = spend.spend;
      out.rewards = rewards(out.card, {category: cat, amount: spend});
      base.push(out);
    }
  });
  
  base.sort((a, b) => (b.rewards-a.rewards));

  return (
    <Card>
      <CardContent>
        <Typography variant="overline">Simulator</Typography>
        {
          (transactions.length === 0 ? (
            <Typography variant="subtitle2" className="text-align-center">
              No spending yet recorded.
            </Typography>
            ) : (
            <>
              <Typography variant="h4" className="text-align-center">
                I'd like to build a&nbsp;
                <Select value={baseSize} onChange={(e) => setBaseSize(e.target.value)} style={{fontSize:'2.125rem'}}>
                  {
                    [1, 2, 3, 4, 5, 6].map(ind => (
                      <MenuItem key={ind} value={ind}>{ind}-card</MenuItem>
                    ))
                  }
                </Select>
                &nbsp;base:
              </Typography>
              <br />
              <TableContainer component={Paper} variant="outlined" style={{maxWidth:Math.min(window.innerWidth - 64, 615)}}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell>Card</TableCell>
                      <TableCell align="right">Projected Rewards</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {
                      base.map((el, ind) => (
                        <TableRow key={ind}>
                          <TableCell>{el.category}</TableCell>
                          <TableCell>
                            {
                              (el.rewards === 0 ? <>N/A</> :
                                  <Link href={el.card.link}>{el.card.issuer} {el.card.name}</Link>
                              )
                            }
                          </TableCell>
                          <TableCell align="right"><b>{format_money(el.rewards)}</b></TableCell>
                        </TableRow>
                      ))
                    }
                    <TableRow style={{fontStyle:'italic'}}>
                      <TableCell>Total</TableCell>
                      <TableCell>Annual fee{baseSize > 1 ? 's' : ''}: {format_money(total_af, true)}</TableCell>
                      <TableCell align='right'><b>{format_money(base.reduce((prev, next) => { return {rewards: prev.rewards+next.rewards}}).rewards-total_af)}</b></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ))
        }
      </CardContent>
    </Card>
  );
}

function QuickActions({ view, setView, accounts, openTransactionDialog, setAccountDialog }){
  return (
    <Card className="flex-grow mr-2 fullwidth">
      <CardContent>
        <Typography variant="overline">Quick Actions</Typography>
        <br />
        <Button variant="contained" color="primary" fullWidth disabled={accounts.length===0} onClick={() => openTransactionDialog()}>Add a Transaction</Button>
        <br />
        <br />
        <Button variant="contained" color="secondary" fullWidth onClick={() => setAccountDialog(true)}>Add an Account</Button>
      </CardContent>
    </Card>
  );
}

function LeftbarWrapper({ noClasses, children }){
  if(noClasses) return (<Card><CardContent>{children}</CardContent></Card>);
  return (<>{children}</>);
}

function Leftbar({ accounts, summary, openAccountDialog, visible, noClasses }){
  if(!visible) return (<></>);
  return (
    <LeftbarWrapper noClasses={noClasses}>
      <div className={noClasses ? "" : "sidebar sidebar-left"}>
        <div className={noClasses ? "" : "sidebar-left-padded"} style={{color:'white'}}>
          <Typography variant="overline" className="flex-space-between">
            Net Worth
            <Button variant="outlined" onClick={openAccountDialog}>+</Button>
          </Typography>
          <Typography variant="h3">{format_money(summary.net_worth, true)}</Typography>
          <Typography variant="subtitle2" color="primary" className="flex-space-between">
            <div>Assets</div>
            <div>{format_money(summary.assets, true)}</div>
          </Typography>
          <LinearProgress variant="determinate" value={100*(summary.assets / ((summary.assets-summary.liabilities)||1))} className="mb-2" />
          <Typography variant="subtitle2" color="secondary" className="flex-space-between">
            <div>Liabilities</div>
            <div>{format_money(summary.liabilities, true)}</div>
          </Typography>
          <LinearProgress variant="determinate" value={Math.abs(100*(summary.liabilities / ((summary.assets-summary.liabilities)||1)))} color="secondary" />
        </div>
        <br />
        <AccountsAccordion name="Cash" accounts={accounts.filter(acc => (acc.type === 'Checking' || acc.type === 'Savings'))} />
        <AccountsAccordion name="Credit" accounts={accounts.filter(acc => (acc.type === 'Credit Card'))} />
        <AccountsAccordion name="Investment" accounts={accounts.filter(acc => (acc.type === 'Investment'))} />
        <AccountsAccordion name="Loan" accounts={accounts.filter(acc => (acc.type === 'Loan'))} />
        <AccountsAccordion name="Other" accounts={accounts.filter(acc => (acc.type === 'Other'))} />
      </div>
    </LeftbarWrapper>
  );
}

function MainView({ summary, accounts, transactions, budget, view, setView, openTransactionDialog, setAccountDialog, removeTransaction, openBudgetDialog, removeBudgetItem }){
  const [hover, setHover] = useState(),
    [tooltip, setTooltip] = useState(),
    [spendingTimescale, setSpendingTimescale] = useState(0),
    [budgetHover, setBudgetHover] = useState();

  const spendingData = [
      {title: 'Restaurants',            value: Math.abs(sum_all(transactions, 'amount', (next) => (conforms_to_timescale(new Date(next.date), spendingTimescale) && next.category==='Restaurants'))),            color: '#689f38'},
      {title: 'Travel / Entertainment', value: Math.abs(sum_all(transactions, 'amount', (next) => (conforms_to_timescale(new Date(next.date), spendingTimescale) && next.category==='Travel / Entertainment'))), color: '#ffca28'},
      {title: 'Groceries',              value: Math.abs(sum_all(transactions, 'amount', (next) => (conforms_to_timescale(new Date(next.date), spendingTimescale) && next.category==='Groceries'))),              color: '#ff9800'},
      {title: 'Gas',                    value: Math.abs(sum_all(transactions, 'amount', (next) => (conforms_to_timescale(new Date(next.date), spendingTimescale) && next.category==='Gas'))),                    color: '#00838f'},
      {title: 'Online shopping',        value: Math.abs(sum_all(transactions, 'amount', (next) => (conforms_to_timescale(new Date(next.date), spendingTimescale) && next.category==='Online shopping'))),        color: '#7b1fa2'},
      {title: 'Other',                  value: Math.abs(sum_all(transactions, 'amount', (next) => (conforms_to_timescale(new Date(next.date), spendingTimescale) && next.category==='Other'))),                  color: '#1a237e'}
    ],
    totalSpending = spendingData.reduce((prev, next) => {return {value: prev.value+next.value}}, {value:0}).value;

  let budgetData = budget.map(item => {
    let out = {
      title: item.name,
      true_value: Math.abs(sum_all(transactions, 'amount', (next) => (conforms_to_timescale(new Date(next.date), 0) && item.categories.indexOf(next.category) > -1 && (item.categories.indexOf('Payment') > -1 && next.category === 'Payment' ? (next.account.id === item.account): true)))),
      color: string_to_color(item.name),
      item
    };
    out.value = Math.min(item.amount, out.true_value);
    return out;
  });
  budgetData.push({
    title: 'Remaining Cash',
    value: sum_all(budget, 'amount', () => true) - sum_all(budgetData, 'value', () => true),
    color: '#555',
    is_remaining_cash: true
  });

  const shortmonth = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May',
    'Jun', 'Jul', 'Aug', 'Sep', 'Oct',
    'Nov', 'Dec'
  ];

  /* TODO: This adds multiple data points for transactions which occurred on the same day */
  let nw = 0,
    tmp,
    historicalDataRaw = transactions.sort((a, b) => (new Date(a.date) - new Date(b.date))).map((el) => {
      nw += el.amount;
      tmp = new Date(el.date);
      return {
        date: el.date,
        x: `${tmp.getDate()}-${shortmonth[tmp.getMonth()]}-${tmp.getFullYear()-2000}`,
        y: nw
      };
    }),
    historicalData = [];

  historicalDataRaw.forEach(point => {
    let el = historicalData.find(el => is_same_day(el.date, point.date));
    if(el === undefined) historicalData.push(point);
    else if(point.y > el.y){
      historicalData.splice(historicalData.indexOf(el), 1);
      historicalData.push(point);
    }
  });

  function has_spending_data(){
    return (sum_all(spendingData, 'value', () => true) > 0);
  }

  function compute_budget_progress(item){
    let out = 0,
        today = new Date();
    transactions.forEach(trans => {
      if(new Date(trans.date).getMonth() === today.getMonth() &&
        item.categories.indexOf(trans.category) > -1 &&
        (item.categories.indexOf('Payment') > -1 && trans.category === 'Payment' ?
          trans.account.id === item.account : true)){
        out += Math.abs(trans.amount);
      }
    });
    return out;
  }

  return (
    <div className="mainview">
      <br />
      <View number={0} view={view}>
        <Leftbar accounts={accounts} summary={summary} openAccountDialog={() => setAccountDialog(true)} visible={true} noClasses={true} />
        <br />
        <QuickActions view={view} setView={setView} accounts={accounts} openTransactionDialog={openTransactionDialog} setAccountDialog={setAccountDialog} />
      </View>
      <View number={1} view={view}>
        <QuickActions view={view} setView={setView} accounts={accounts} openTransactionDialog={openTransactionDialog} setAccountDialog={setAccountDialog} />
        <br />
        <div className="flex-space-between">
          <Card className="flex-grow mr-2">
            <CardContent style={{height:'250px'}}>
              <Typography variant="overline">Cash Flow</Typography>
              <br />
              <br />
              <div>
                <Typography variant="subtitle2" color="primary" className="flex-space-between">
                  <div>Income:</div>
                  <div>{format_money(summary.income, true)}</div>
                </Typography>
                <LinearProgress variant="determinate" value={Math.min(100, 100*summary.income/(summary.last_month_income||summary.net_worth||1))} style={{height:'30px'}} />
                <Typography variant="subtitle2" color="primary" className="flex-space-between">
                  <div>Last Month:</div>
                  <div>{summary.last_month_income ? format_money(summary.last_month_income, true) : 'N/A'}</div>
                </Typography>
                <br />
                <Typography variant="subtitle2" color="secondary" className="flex-space-between">
                  <div>Expenses:</div>
                  <div>{format_money(summary.expenses, true)}</div>
                </Typography>
                <LinearProgress variant="determinate" value={Math.min(100, Math.abs(100*summary.expenses/(summary.last_month_expenses||summary.net_worth||1)))} style={{height:'30px'}} color="secondary" />
                <Typography variant="subtitle2" color="secondary" className="flex-space-between">
                  <div>Last Month:</div>
                  <div>{summary.last_month_expenses ? format_money(summary.last_month_expenses, true) : 'N/A'}</div>
                </Typography>
              </div>
            </CardContent>
          </Card>
          <Card className="flex-grow ml-2" style={{maxWidth:'50%'}}>
            <CardContent style={{height:'250px'}}>
              <Typography variant="overline">Spending</Typography>
              <Tabs value={spendingTimescale} onChange={(e, n) => setSpendingTimescale(n)}>
                <Tab label="Month" className="small-tab" />
                <Tab label="YTD" className="small-tab" />
                <Tab label="All" className="small-tab" />
              </Tabs>
              <div data-tip=''>
                <PieChart
                  radius={(window.innerWidth <= 600 ? 60 : 30)}
                  lineWidth={30}
                  viewBoxSize={[120, (window.innerWidth <= 600 ? 150 : 65)]}
                  center={[60, (window.innerWidth <= 600 ? 150/2 : 35)]}
                  data={spendingData}
                  label={() => (has_spending_data() ? format_money(Math.abs(totalSpending)) : 'None yet.')}
                  labelStyle={{
                    fontSize: (window.innerWidth <= 600 ? '0.8rem' : '0.4rem'),
                    fontFamily: 'Roboto, sans-serif',
                    // fill: '#333',
                    fill: '#ddd'
                  }}
                  labelPosition={0}
                  onMouseOver={(e, ind) => setHover(`${spendingData[ind].title}: ${format_money(spendingData[ind].value)}`)}
                  onMouseOut={() => setHover(null)}
                />
                <ReactTooltip place="top" type="dark" effect="float" getContent={() => hover} />
              </div>
            </CardContent>
          </Card>
        </div>
        <br />
        <Card>
          <CardContent style={historicalData[0]===undefined||historicalData[0].length===0?{}:{minHeight:'200px'}} data-tip=''>
            <Typography variant="overline">Historical Net Worth</Typography>
            {
              (historicalData[0]===undefined||historicalData[0].length === 0 ? (
                <Typography variant="subtitle2" className="text-align-center">
                  <br />
                  No data yet.
                </Typography>
              ) : (
                <AreaChart
                  width={Math.min(window.innerWidth - 64, 615)}
                  height={200}
                  mouseOverHandler={(d, e) => setTooltip(format_money(d.y, true))}
                  mouseOutHandler={(d, e) => setTooltip()}
                  axes
                  axisLabels={{x: 'Date', y: 'Net Worth'}}
                  xType="time"
                  xTicks={3}
                  areaColors={["green"]}
                  dataPoints
                  interpolate="cardinal"
                  data={[historicalData]}
                />
              ))
            }
            <ReactTooltip place="top" type="dark" effect="float" getContent={() => tooltip} />
          </CardContent>
        </Card>
        <br />
        <div className="flex-space-between">
          <div className="flex-grow mr-2" style={{maxWidth:"50%"}}>
            <Card style={{minHeight:'250px',height:(53+(budget.length*79))+'px'}}>
              <CardContent data-tip="">
                <Typography variant="overline">Budget Overview</Typography>
                {
                  (budget.length === 0 ? (
                    <Typography variant="subtitle2" className="text-align-center">
                      <br />
                      <br />
                      <br />
                      <br />
                      No budget yet.
                    </Typography>
                  ) : (<>
                      <PieChart
                        radius={(window.innerWidth <= 600 ? 60 : 30)}
                        viewBoxSize={[120, (window.innerWidth <= 600 ? 150 : 65+(budget.length*8))]}
                        center={[60, (window.innerWidth <= 600 ? 150/2 : 35+(budget.length*4))]}
                        data={budgetData}
                        onMouseOver={(e, ind) => { if(budgetData[ind].is_remaining_cash) setBudgetHover(`Remaining: ${format_money(budgetData[ind].value)}`); else setBudgetHover(`${budgetData[ind].title}: ${format_money(budgetData[ind].true_value)} / ${format_money(budgetData[ind].item.amount)}`) }}
                        onMouseOut={() => setBudgetHover(null)}
                      />
                      <ReactTooltip place="top" type="dark" effect="float" getContent={() => budgetHover} />
                    </>
                  ))
                }
              </CardContent>
            </Card>
          </div>
          <div className="flex-grow ml-2" style={{maxWidth:"50%"}}>
            <Card style={{minHeight:'250px'}}>
              <CardContent>
                <Typography variant="overline">Budget Items</Typography>
                {
                  (budget.length === 0 ? (
                    <Typography variant="subtitle2" className="text-align-center">
                      <br />
                      <br />
                      <br />
                      <br />
                      No budget yet.
                    </Typography>
                  ) : 
                  budget.map((el, ind) => {
                    let progress = compute_budget_progress(el),
                      color = (progress >= el.amount ? 'secondary' : 'primary');
                    return (<div key={ind}>
                      <div className="flex-space-between">
                        <Typography variant="overline" color={color}>{el.name}</Typography>
                      </div>
                      <LinearProgress variant="determinate" color={color} value={Math.min(100, 100*(progress/el.amount))} style={{height:'30px'}} />
                      {
                        (ind < budget.length-1 ? (<br />) : (<></>))
                      }
                    </div>);
                  }))
                }
              </CardContent>
            </Card>
          </div>
        </div>
      </View>
      <View number={2} view={view}>
        <Button
          variant="contained"
          color="secondary"
          fullWidth
          onClick={() => openTransactionDialog() }
          disabled={accounts.length === 0}
        >
          Add New
        </Button>
        <br />
        <br />
        <TransactionList transactions={transactions} max={5} paginate={true} openTransactionDialog={openTransactionDialog} removeTransaction={removeTransaction} />
      </View>
      <View number={3} view={view}>
        <CardSimulator summary={summary} accounts={accounts} transactions={transactions} />
      </View>
      <View number={4} view={view}>
        <Card>
          <CardContent>
            <Typography variant="overline">Budget</Typography>
            <Button variant="contained" color="primary" fullWidth onClick={() => openBudgetDialog()}>Add New</Button>
            {
              (budget.length > 0 ? (<>
                <br />
                <br />
              </>) : (<Typography variant="subtitle2" className="text-align-center"><br />No budget items yet added.</Typography>))
            }
            {
              budget.map((el, ind) => {
                let progress = compute_budget_progress(el),
                  color = (progress >= el.amount ? 'secondary' : 'primary');

                return (<div key={ind}>
                  <Card variant="outlined" className="pl-10">
                    <div className="flex-space-between">
                      <div className="flex-grow">
                        <div className="flex-space-between">
                          <Typography variant="overline" color={color}>{el.name}</Typography>
                          <Typography variant="overline" color={color}>{format_money(progress, true)} / {format_money(el.amount, true)}</Typography>
                        </div>
                        <LinearProgress variant="determinate" color={color} value={Math.min(100, 100*(progress/el.amount))} style={{height:'30px'}} />
                      </div>
                      <div className="ml-10">
                        <IconButton onClick={() => openBudgetDialog(el)}>
                          <Edit />
                        </IconButton>
                        <br />
                        <IconButton onClick={() => removeBudgetItem(el)}>
                          <Delete />
                        </IconButton>
                      </div>
                    </div>
                  </Card>
                  { (ind < budget.length-1 ? (<br />) : (<></>)) }
                </div>)
              })
            }
          </CardContent>
        </Card>
      </View>
      <br />
    </div>
  );
}

function Rightbar({ summary, accounts, transactions }){
  const REWARDS_TIMESCALE_MONTH = 0,
    REWARDS_TIMESCALE_YTD = 1,
    REWARDS_TIMESCALE_ALL = 2;

  const [hover, setHover] = useState(),
    [rewardsTimescale, setRewardsTimescale] = useState(REWARDS_TIMESCALE_MONTH);

  const db = collapse_object(accounts_db['Credit Card']);

  const categories = [
    "Restaurants",
    "Travel / Entertainment",
    "Groceries",
    "Gas",
    "Online shopping",
    "Other"
  ];

  function rewards(card, trans){
    let cat = trans.category;
    if(categories.indexOf(cat) === -1) return 0;
    if(cat === 'Travel / Entertainment') cat = 'Travel';
    return Math.abs(trans.amount * card[cat.toLowerCase()] * card.conversion);
  }

  function sort_cards_by_rewards(){
    let out = db.slice();
    out.forEach(card => {
      let tot = -card.fee;
      transactions.forEach(trans => {
        tot += rewards(card, trans);
      });
      card.total_rewards = tot;
    });
    out.sort((a, b) => {
      return b.total_rewards-a.total_rewards;
    });
    return out;
  }

  let base = sort_cards_by_rewards(),
    rec = base[0],
    i = 0;

  while(accounts.find(el => (el.issuer===rec.issuer&&el.name===rec.name))){
    rec = base[++i];
  }

  /***/

  let chartData = [];
  transactions.forEach(trans => {
    if(trans.account.type !== 'Credit Card') return;
    
    let card = chartData.find(el => el.title === trans.account.name);
    if((rewardsTimescale === REWARDS_TIMESCALE_MONTH &&
        new Date(trans.date).getMonth() === new Date().getMonth()) ||
       (rewardsTimescale === REWARDS_TIMESCALE_YTD &&
        new Date(trans.date).getFullYear() === new Date().getFullYear()) ||
       (rewardsTimescale === REWARDS_TIMESCALE_ALL)){
      if(rewards(trans.account.props, trans) > 0){
        if(card === undefined){
          chartData.push({
            title: trans.account.name,
            value: rewards(trans.account.props, trans),
            color: string_to_color(trans.account.name)
          });
        } else {
          card.value += rewards(trans.account.props, trans);
        }
      }
    }
  });
  window.chartData = chartData; /* XXX: This is just terrible */

  /***/

  /* TODO: This breaks if the statement date is on the 29th or later of any month */
  let upcomingStatements = accounts.filter(el => (el.type === 'Credit Card' && in_range(new Date(el.date).getDate()-(new Date()).getDate(), 0, 7)))

  return (
    <div className="sidebar sidebar-right">
      <Card>
        <CardContent>
          <Typography variant="overline">Upcoming Statement Date{upcomingStatements.length === 1 ? '' : 's'}</Typography>
          <br />
          <br />
          <div className="flex-center text-align-center">
            <div>
            {
              (upcomingStatements.length === 0 ? (
                <Typography variant="subtitle2">
                  No upcoming statement dates.
                </Typography>
              ) : (<></>))
            }
            {
              upcomingStatements.map((card, ind) => {
                let today = new Date(),
                  statement = new Date(card.date),
                  difference = statement.getDate()-today.getDate();
                return (<div key={ind}>
                  <img width={200} src={card.props.image} className="card-image" alt="Next card due" />
                  <Typography variant="subtitle1">{card.issuer}</Typography>
                  <Typography variant="h6">{card.name}</Typography>
                  <Typography variant="subtitle2">{today.getMonth()+1}/{statement.getDate()}/{today.getFullYear()} ({(difference === 0 ? 'today' : (difference === 1 ? 'tomorrow' : difference + ' days'))})</Typography>
                  <Typography variant="subtitle2">Balance: {format_money(-card.balance)}</Typography>
                  { ind === upcomingStatements.length-1 ? (<></>) : (<br />) }
                </div>);
              })
            }
          </div>
          </div>
        </CardContent>
      </Card>
      <br />
      <Card>
        <CardContent>
          <Typography variant="overline">Recommended Next Card</Typography>
          <br />
          <br />
          <div className="flex-center text-align-center">
            {
              (summary.expenses === 0 ? (
                  <Typography variant="subtitle2">
                    No recommendation yet.
                  </Typography>
                ) : (
                  <div>
                    <img width={200} src={rec.image} className="card-image" alt="Recommended next card" />
                    <Link href={rec.link}>
                      <Typography variant="subtitle1">{rec.issuer}</Typography>
                      <Typography variant="h6">{rec.name}</Typography>
                    </Link>
                    <Typography variant="subtitle2">Est. Return: {format_money(rec.total_rewards)}</Typography>
                  </div>
                )
              )
            }
          </div>
        </CardContent>
      </Card>
      <br />
      <Card>
        <CardContent>
          <Typography variant="overline">Rewards</Typography>
          <Tabs value={rewardsTimescale} onChange={(e, n) => setRewardsTimescale(n)}>
            <Tab label="Month" className="small-tab" />
            <Tab label="YTD" className="small-tab" />
            <Tab label="All" className="small-tab" />
          </Tabs>
          <div data-tip=''>
            {
              (chartData.length === 0 ? (
                <>
                  <br />
                  <Typography variant="subtitle2" className="text-align-center">
                    None yet.
                  </Typography>
                </>
              ) : (
                <>
                    <PieChart
                      radius={(window.innerWidth <= 600 ? 60 : 30)}
                      lineWidth={30}
                      viewBoxSize={[120, (window.innerWidth <= 600 ? 150 : 65)]}
                      center={[60, (window.innerWidth <= 600 ? 150/2 : 35)]}
                      data={chartData}
                      label={()=>{return (chartData.length === 0 ? 'None yet.' : format_money(sum_all(chartData, 'value', () => true)))}}
                      labelStyle={{
                        fontSize: (window.innerWidth <= 600 ? '0.8rem' : '0.4rem'),
                        fontFamily: 'Roboto, sans-serif',
                        // fill: '#333',
                        fill: '#ddd'
                      }}
                      labelPosition={0}
                      onMouseOver={(e, ind) => setHover(chartData[ind].title + ': ' + format_money(chartData[ind].value))}
                      onMouseOut={() => setHover(null)}
                    />
                    <ReactTooltip place="top" type="dark" effect="float" getContent={() => hover} />
                  </>
                )
              )
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function App(){
  const [accounts, setAccounts] = useState(local_storage_get('accounts') || []),
    [transactions, setTransactions] = useState(local_storage_get('transactions') || []),
    [summary, setSummary] = useState({
      net_worth: 0,
      assets: 0,
      liabilities: 0,
      income: 0,
      expenses: 0,
      last_month_income: 0,
      last_month_expenses: 0
    }),
    [transRef, setTransRef] = useState(),
    [budget, setBudget] = useState(local_storage_get('budget') || []),
    [budgetItemRef, setBudgetItemRef] = useState(),
    [resizeHelper, setResizeHelper] = useState();

  const [view, setView] = useState(window.innerWidth <= MOBILE_CUTOFF ? 0 : 1),
        [accountDialog, setAccountDialog] = useState(false),
        [transactionDialog, setTransactionDialog] = useState(false),
        [budgetDialog, setBudgetDialog] = useState(false);

  /*
   * ACCOUNT/TRANSATION/BUDGET MANAGEMENT
   */
  function addAccount(type, account, date, balance){
    let account_class = new Account(type, account, date, balance);

    setAccounts([
      ...accounts,
      account_class
    ]);

    if(balance !== 0){
      setTransactions([
        ...transactions,
        new Transaction(new Date(), 'Starting Balance', 'Starting Balance', account_class, undefined, balance)
      ]);
    }
  }
  function addTransaction(date, name, category, account, paymentAccount, amount){
    let trans = new Transaction(date, name, category, account, paymentAccount, amount);
    if(transRef){
      let tmp = transactions.slice();
      let found = transactions.find(el => el.id === transRef.id);
      tmp.splice(transactions.indexOf(found), 1);
      tmp.push(trans);
      setTransactions(tmp);
    } else setTransactions([
      ...transactions,
      trans
    ]);
  }
  function removeTransaction(trans){
    let tmp = transactions.slice();
    tmp.splice(transactions.indexOf(trans), 1);
    setTransactions(tmp);
  }

  function openTransactionDialog(trans){
    if(trans) setTransRef(trans);
    else setTransRef();
    setTransactionDialog(true);
  }

  function addBudgetItem(name, amount, categories, account){
    let budget_item = new BudgetItem(name, amount, categories, account);
    if(budgetItemRef){
      let tmp = budget.slice();
      let found = budget.find(el => el.id === budgetItemRef.id);
      tmp.splice(budget.indexOf(found), 1);
      tmp.push(budget_item);
      setBudget(tmp);
    } else setBudget([
      ...budget,
      budget_item
    ]);
  }
  function openBudgetDialog(budget_item){
    if(budget_item) setBudgetItemRef(budget_item);
    else setBudgetItemRef();
    setBudgetDialog(true);
  }
  function removeBudgetItem(item){
    let tmp = budget.slice();
    tmp.splice(budget.indexOf(item), 1);
    setBudget(tmp);
  }

  /*
   * EFFECT HOOKS
   */
  useEffect(() => {
    setSummary({
      net_worth:   sum_all(accounts, 'balance', (next) => true),
      assets:      sum_all(accounts, 'balance', (next) => next.balance > 0),
      liabilities: sum_all(accounts, 'balance', (next) => next.balance < 0),
      income: summary.income,
      expenses: summary.expenses,
      last_month_income: summary.last_month_income,
      last_month_expenses: summary.last_month_expenses
    });
  }, [accounts]);

  useEffect(() => {
    const month = new Date().getMonth();

    let new_accounts = accounts.slice(),
      new_trans = transactions.sort((a, b) => (new Date(b.date) - new Date(a.date))),
      new_summary = {
        net_worth: summary.net_worth,
        assets: summary.assets,
        liabilities: summary.liabilities,
        income: 0,
        expenses: 0,
        last_month_income: 0,
        last_month_expenses: 0
      };
    
    new_accounts.forEach(acc => {
      acc.balance = 0;
    });

    new_trans.forEach(trans => {
      let acc = new_accounts.find((el) => (el.id === trans.account.id));
      if(acc === undefined) return;
      acc.balance += trans.amount;

      if(trans.category === 'Payment'){
        new_accounts.find((el) => (el.id === trans.paymentAccount.id)).balance -= trans.amount;
      }

      let d = new Date(trans.date);
      if(d.getMonth() === month){
        if(trans.amount > 0) new_summary.income += trans.amount;
        else new_summary.expenses += trans.amount;
      } else if(d.getMonth() === month-1 ||
        (month === 0 && d.getMonth() === 11)){
        if(trans.amount > 0) new_summary.last_month_income += trans.amount;
        else new_summary.last_month_expenses += trans.amount;
      }
    });

    setAccounts(new_accounts);
    setTransactions(new_trans);
    setSummary(new_summary);
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('accounts', JSON.stringify(accounts));
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('budget', JSON.stringify(budget));
  }, [accounts, transactions, budget]);

  useEffect(() => {
    window.scrollTo(0, 0);
    location.hash = view;
  }, [view]);
  window.onhashchange = () => {
    setView(parseInt(location.hash.slice(1)));
  };

  window.onresize = () => {
    setResizeHelper(Math.random());
  };

  /*
   * THEME
   */
  const theme = createTheme({
    palette: {
      type: 'dark',
      primary: {
        main: '#45818E'
      },
      secondary: {
        main: '#CD5D7D',
      }
    }
  });

  /*
   * RENDER
   */
  return (
    <ThemeProvider theme={theme}>
      <AccountDialog isOpen={accountDialog} addAccount={addAccount} close={() => setAccountDialog(false)} />
      <TransactionDialog accounts={accounts} setAccounts={setAccounts} isOpen={transactionDialog} addTransaction={addTransaction} close={() => setTransactionDialog(false)} transRef={transRef} setTransRef={setTransRef} />
      <BudgetDialog accounts={accounts} isOpen={budgetDialog} addBudgetItem={addBudgetItem} close={() => setBudgetDialog(false)} budgetItemRef={budgetItemRef} setBudgetItemRef={setBudgetItemRef} />

      <NavigationController view={view} setView={setView} />

      <Grid
        container
        justifyContent="space-between"
      >
        <Leftbar accounts={accounts} summary={summary} openAccountDialog={() => setAccountDialog(true)} visible={window.innerWidth >= MOBILE_CUTOFF} />
        <MainView view={view} summary={summary} accounts={accounts} transactions={transactions} budget={budget} setView={setView} openTransactionDialog={openTransactionDialog} setAccountDialog={setAccountDialog} removeTransaction={removeTransaction} openBudgetDialog={openBudgetDialog} removeBudgetItem={removeBudgetItem} />
        <Rightbar summary={summary} accounts={accounts} transactions={transactions} setAccountDialog={setAccountDialog} />
      </Grid>
    </ThemeProvider>
  );
}
