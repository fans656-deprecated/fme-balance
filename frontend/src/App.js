import React from 'react';
import {
  Layout, Button, Input, Tabs,
  Select, Card, DatePicker, Radio,
  message as Message,
} from 'antd';
import moment from 'moment';
import ReactEcharts from 'echarts-for-react';
import dateFormat from 'dateformat';
import 'antd/dist/antd.css';

import conf from './conf';
import api from './api';

const TabPane = Tabs.TabPane;
const Option = Select.Option;
const TextArea = Input.TextArea;

export default class App extends React.Component {
  state = {
    selected: 'items',
    //selected: 'stat',

    amount: '',
    tags: [],
    desc: '',
    date: moment(new Date(), 'yyyy-mm-dd'),

    addButtonEnabled: false,

    days: [],

    rawText: '',
  }

  componentDidMount = async () => {
    this.onTabChange(this.state.selected);
    this.updateRecent();
  }

  render() {
    return (
      <Layout className="body">
        <Tabs defaultActiveKey={this.state.selected} onChange={this.onTabChange}>
          <TabPane tab="Items" key="items" className="items page">
            <div className="horz">
              <Input className="amount" placeholder="Amount"
                onChange={this.onAmountChange}
              />
              <Select
                className="tags"
                mode="tags"
                placeholder="Tags"
                onChange={this.onTagsChange}
                ref={ref => this.tags = ref}
              >
                {conf.tags.map(tag => <Option key={tag}>{tag}</Option>)}
              </Select>
              <DatePicker className="date"
                defaultValue={this.state.date}
                onChange={this.onDateChange}
              />
            </div>
            <div className="horz">
              <Input className="desc" placeholder="Description"
                onChange={this.onDescChange}
              />
              <Button className="add"
                disabled={!this.state.addButtonEnabled}
                type="primary"
                onClick={this.addItem}
              >Add</Button>
            </div>
            <div className="days">
              {this.state.days.map(this.renderDay)}
            </div>
          </TabPane>
          <TabPane tab="Statistics" key="stat" className="page">
            {this.renderStatistics()}
          </TabPane>
          <TabPane tab="Raw" key="raw" className="raw page">
            <TextArea className="raw-edit" value={this.state.rawText}
              onChange={({target}) => this.setState({rawText: target.value})}
            />
            <Button type="primary" onClick={this.saveRaw}>Save</Button>
          </TabPane>
        </Tabs>
      </Layout>
    );
  }

  renderStatistics = () => {
    const colors = ['#393939','#f5b031','#fad797','#59ccf7','#c3b4df'];
    const pieData = [
      {value: 100, name: 'foo', tag: 'what'},
      {value: 200, name: 'bar', tag: 'what'},
      {value: 50, name: 'baz', tag: 'what'},
    ];
    let i = 0;
    return (
      <div className="stat page">
        <ReactEcharts
          className="main-pie"
          option={{
            series: [{
              type: 'pie',
              data: pieData,
              itemStyle: {
                normal: {
                  color: (data) => {
                    const tag = data.data.tag;
                    const color = TAG_TO_COLOR[tag];
                    if (color) return color;
                    i = (i + 1) % colors.length;
                    return colors[i];
                  },
                },
              },
            }]
          }}
          onEvents={{
            click: this.onPieClick,
          }}
        />
        <div className="controls">
          <Radio.Group className="range-type"
            defaultValue="all"
            onChange={this.onStatRangeTypeChange}
          >
            <Radio.Button value="all">All</Radio.Button>
            <Radio.Button value="year">Year</Radio.Button>
            <Radio.Button value="month">Month</Radio.Button>
          </Radio.Group>
          <div>
            <Button>Prev</Button>
            <Button>Next</Button>
          </div>
        </div>
      </div>
    );
  }

  renderDay = (day) => {
    return (
      <Card key={day.date} className="day-card">
        <div className="date">
          {day.date}
        </div>
        <div className="items">
          {day.items.map((item, i) => {
            return (
              <div key={i} className="item">
                <span className="amount">
                  {item.amount}
                </span>
                <span className="desc">
                  {item.desc || ''}
                </span>
                <span className="tags">
                  {item.tags.length ? '{' + item.tags.join(' ') + '}' : ''}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  updateRecent = async () => {
    const days = await this.fetchDays();
    this.setState({days: days});
  }

  fetchDays = async () => {
    const days = [];
    const res = await api.get('/api/days?count=10');
    if (res.status === 200) {
      const { days } = await res.json()
      return days;
    } else {
      return [];
    }
  }

  fetchDay = async (date) => {
    const res = await api.get('/api/items?date=' + date);
    const { items } = res.status === 200 ? await res.json() : [];
    return {
      date: date,
      items: items,
    };
  }

  onTabChange = async (selected) => {
    if (selected === 'raw') {
      const res = await api.get('/api/items');
      if (res.status === 200) {
        const { items } = await res.json();
        items.reverse();
        const lines = [];
        let date = null;
        for (const item of items) {
          if (item.date !== date) {
            date = item.date;
            lines.push(date);
          }
          let line = '    ';
          line += item.amount.toString();
          if (item.desc && item.desc.length) {
            line += ' ' + item.desc;
          }
          if (item.tags.length) {
            line += ' {' + item.tags.join(':') + '}';
          }
          lines.push(line);
        }
        const text = lines.join('\n');
        this.setState({rawText: text});
      } else {
        Message.error(res.status + ' ' + await res.text());
      }
    }
  }

  onAmountChange = ({target}) => {
    this.setState({amount: target.value || ''},
      this.updateAddButtonEnableState
    );
  }

  onTagsChange = (tags) => {
    this.setState({tags: tags});
  }

  onDescChange = ({target}) => {
    this.setState({desc: target.value || ''},
      this.updateAddButtonEnableState
    );
  }

  onDateChange = (moment) => {
    this.setState({date: moment});
  }

  updateAddButtonEnableState = () => {
    const { amount, desc } = this.state;
    console.log(amount.length > 0, desc.length > 0);
    this.setState({addButtonEnabled: amount.length > 0 && desc.length > 0});
  }

  addItem = async () => {
    const { amount, tags, desc } = this.state;
    const date = this.state.date.format('YYYY-MM-DD');
    const ctime = date + ' ' + dateFormat(new Date(), 'HH:MM:ss');
    const item = {
      amount: -amount,
      tags: tags,
      desc: desc,
      date: date,
      ctime: ctime,
    };
    const res = await api.post('/api/item', item);
    if (res.status === 200) {
      Message.success('Added');
      this.updateRecent();
    }
  }

  saveRaw = async () => {
    const res = await api.putRaw('/api/raw', this.state.rawText);
    if (res.status === 200) {
      Message.success('Saved');
    } else {
      Message.error('Failed');
    }
  }
}

const TAG_TO_COLOR = {
  'rent': '#000000',
  'invest': '#2F922A',
  'parent': '#4959A8',
  'her': '#E185E4',
  'daily': '#E87352',
  'other': '#cccccc',

  'health': '#D9D9D9',
  'social': '#50BABA',

  'eat': '#E87352',
};
