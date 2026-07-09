/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Input,
  Button,
  Table,
  Tag,
  Spin,
  Collapse,
  Toast,
  Space,
  Tooltip,
  Typography,
  Empty,
} from '@douyinfe/semi-ui';
import { IconSearch, IconCopy, IconDownload } from '@douyinfe/semi-icons';
import {
  API,
  showError,
  showSuccess,
  renderQuota,
  timestamp2string,
  copy,
  stringToColor,
} from '../../helpers';

const { Text } = Typography;
const { Panel } = Collapse;
const ITEMS_PER_PAGE = 10;

function renderUseTime(type) {
  const time = parseInt(type);
  if (time < 101) {
    return <Tag color="green" size="large">{time} 秒</Tag>;
  } else if (time < 301) {
    return <Tag color="orange" size="large">{time} 秒</Tag>;
  } else {
    return <Tag color="red" size="large">{time} 秒</Tag>;
  }
}

function renderIsStream(bool) {
  if (bool) {
    return <Tag color="blue" size="large">流</Tag>;
  } else {
    return <Tag color="purple" size="large">非流</Tag>;
  }
}

const UsageToken = () => {
  const { t } = useTranslation();
  const [apikey, setAPIKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeKeys, setActiveKeys] = useState([]);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [tokenData, setTokenData] = useState({
    totalGranted: 0,
    totalUsed: 0,
    totalAvailable: 0,
    unlimitedQuota: false,
    expiresAt: 0,
    tokenName: '',
    tokenValid: false,
  });
  const [logs, setLogs] = useState([]);

  const fetchData = async () => {
    if (apikey === '') {
      Toast.warning(t('请先输入令牌，再进行查询'));
      return;
    }
    if (!/^sk-[a-zA-Z0-9]{48}$/.test(apikey)) {
      Toast.error(t('令牌格式非法'));
      return;
    }
    setLoading(true);
    let newData = {
      totalGranted: 0,
      totalUsed: 0,
      totalAvailable: 0,
      unlimitedQuota: false,
      expiresAt: 0,
      tokenName: '',
      tokenValid: false,
    };
    setLogs([]);

    try {
      const usageRes = await API.get('/api/usage/token/', {
        headers: { Authorization: `Bearer ${apikey}` },
      });
      const usageData = usageRes.data;
      if (usageData.code) {
        const d = usageData.data;
        newData = {
          unlimitedQuota: d.unlimited_quota,
          totalGranted: d.total_granted,
          totalUsed: d.total_used,
          totalAvailable: d.total_available,
          expiresAt: d.expires_at,
          tokenName: d.name,
          tokenValid: true,
        };
      } else {
        Toast.error(usageData.message || t('查询令牌信息失败'));
      }
    } catch (e) {
      Toast.error(t('查询令牌信息失败，请检查令牌是否正确'));
      setLoading(false);
      return;
    }

    try {
      const logRes = await API.get('/api/log/token', {
        headers: { Authorization: `Bearer ${apikey}` },
      });
      const { success, data: logData } = logRes.data;
      if (success) {
        setLogs(logData.reverse());
        setActiveKeys(['1', '2']);
      } else {
        Toast.error(t('查询调用详情失败，请输入正确的令牌'));
      }
    } catch (e) {
      Toast.error(t('查询失败，请输入正确的令牌'));
    }

    setTokenData(newData);
    setLoading(false);
  };

  const copyTokenInfo = (e) => {
    e.stopPropagation();
    const info = `${t('令牌名称')}: ${tokenData.tokenName || t('未知')}
${t('令牌总额')}: ${tokenData.unlimitedQuota ? t('无限') : renderQuota(tokenData.totalGranted, 3)}
${t('剩余额度')}: ${tokenData.unlimitedQuota ? t('无限制') : renderQuota(tokenData.totalAvailable, 3)}
${t('已用额度')}: ${tokenData.unlimitedQuota ? t('不进行计算') : renderQuota(tokenData.totalUsed, 3)}
${t('有效期至')}: ${tokenData.expiresAt === 0 ? t('永不过期') : timestamp2string(tokenData.expiresAt)}`;
    copy(info);
    showSuccess(t('已复制令牌信息'));
  };

  const exportCSV = (e) => {
    e.stopPropagation();
    if (logs.length === 0) return;
    const headers = [
      t('时间'),
      t('模型'),
      t('用时'),
      t('提示'),
      t('补全'),
      t('花费'),
      t('详情'),
    ];
    const rows = logs.map((log) => [
      timestamp2string(log.created_at),
      log.model_name || '',
      String(log.use_time),
      String(log.prompt_tokens),
      String(log.completion_tokens),
      String(log.quota),
      (log.content || '').replace(/"/g, '""'),
    ]);
    const csv =
      '\ufeff' +
      [headers, ...rows]
        .map((r) => r.map((c) => `"${c}"`).join(','))
        .join('\n');
    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'token-usage.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
      showSuccess(t('导出成功'));
    } catch (err) {
      showError(t('导出失败，请稍后重试'));
    }
  };

  const columns = [
    {
      title: t('时间'),
      dataIndex: 'created_at',
      render: (val) => timestamp2string(val),
      sorter: (a, b) => a.created_at - b.created_at,
      defaultSortOrder: 'descend',
    },
    {
      title: t('模型'),
      dataIndex: 'model_name',
      render: (text, record) => {
        if (record.type !== 0 && record.type !== 2) return null;
        return (
          <Tag
            color={stringToColor(text)}
            size="large"
            onClick={() => copy(text)}
            style={{ cursor: 'pointer' }}
          >
            {text}
          </Tag>
        );
      },
      sorter: (a, b) => ('' + a.model_name).localeCompare(b.model_name),
    },
    {
      title: t('用时'),
      dataIndex: 'use_time',
      render: (text, record) => {
        if (record.type !== 0 && record.type !== 2) return null;
        return (
          <Space>
            {renderUseTime(text)}
            {renderIsStream(record.is_stream)}
          </Space>
        );
      },
      sorter: (a, b) => a.use_time - b.use_time,
    },
    {
      title: t('提示'),
      dataIndex: 'prompt_tokens',
      render: (text, record) => {
        if (record.type !== 0 && record.type !== 2) return null;
        return <span>{text}</span>;
      },
      sorter: (a, b) => a.prompt_tokens - b.prompt_tokens,
    },
    {
      title: t('补全'),
      dataIndex: 'completion_tokens',
      render: (text, record) => {
        if (parseInt(text) > 0 && (record.type === 0 || record.type === 2)) {
          return <span>{text}</span>;
        }
        return null;
      },
      sorter: (a, b) => a.completion_tokens - b.completion_tokens,
    },
    {
      title: t('花费'),
      dataIndex: 'quota',
      render: (text, record) => {
        if (record.type !== 0 && record.type !== 2) return null;
        return renderQuota(text, 6);
      },
      sorter: (a, b) => a.quota - b.quota,
    },
    {
      title: t('详情'),
      dataIndex: 'content',
      render: (text) => {
        return (
          <Tooltip content={text}>
            <Text
              ellipsis={{ rows: 2, showTooltip: { type: 'popover' } }}
              style={{ maxWidth: 200 }}
            >
              {text}
            </Text>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <>
      <Card style={{ marginTop: 88 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Input
            showClear
            value={apikey}
            onChange={(value) => setAPIKey(value)}
            placeholder={t('请输入要查询的令牌 sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')}
            prefix={<IconSearch />}
            onEnterPress={fetchData}
            style={{ flex: 1 }}
          />
          <Button
            type='primary'
            theme="solid"
            onClick={fetchData}
            loading={loading}
            disabled={apikey === ''}
          >
            {t('查询')}
          </Button>
        </div>
      </Card>
      <Card style={{ marginTop: 24 }}>
        <Collapse activeKey={activeKeys} onChange={(keys) => setActiveKeys(keys)}>
          <Panel
            header={t('令牌信息')}
            itemKey="1"
            extra={
              <Button
                icon={<IconCopy />}
                theme='borderless'
                type='primary'
                onClick={(e) => copyTokenInfo(e)}
                disabled={!tokenData.tokenValid}
              >
                {t('复制令牌信息')}
              </Button>
            }
          >
            <Spin spinning={loading}>
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary">
                  {t('令牌名称')}：{tokenData.tokenName || t('未知')}
                </Text>
                <br /><br />
                <Text type="secondary">
                  {t('令牌总额')}：{tokenData.unlimitedQuota ? t('无限') : !tokenData.tokenValid ? t('未知') : renderQuota(tokenData.totalGranted, 3)}
                </Text>
                <br /><br />
                <Text type="secondary">
                  {t('剩余额度')}：{tokenData.unlimitedQuota ? t('无限制') : !tokenData.tokenValid ? t('未知') : renderQuota(tokenData.totalAvailable, 3)}
                </Text>
                <br /><br />
                <Text type="secondary">
                  {t('已用额度')}：{tokenData.unlimitedQuota ? t('不进行计算') : !tokenData.tokenValid ? t('未知') : renderQuota(tokenData.totalUsed, 3)}
                </Text>
                <br /><br />
                <Text type="secondary">
                  {t('有效期至')}：{tokenData.expiresAt === 0 ? t('永不过期') : !tokenData.tokenValid ? t('未知') : timestamp2string(tokenData.expiresAt)}
                </Text>
              </div>
            </Spin>
          </Panel>
          <Panel
            header={t('调用详情')}
            itemKey="2"
            extra={
              <Button
                icon={<IconDownload />}
                theme='borderless'
                type='primary'
                onClick={(e) => exportCSV(e)}
                disabled={!tokenData.tokenValid || logs.length === 0}
              >
                {t('导出为CSV文件')}
              </Button>
            }
          >
            <Spin spinning={loading}>
              {logs.length === 0 ? (
                <Empty description={t('暂无记录')} />
              ) : (
                <Table
                  columns={columns}
                  dataSource={logs}
                  rowKey='id'
                  pagination={{
                    pageSize: pageSize,
                    hideOnSinglePage: true,
                    showSizeChanger: true,
                    pageSizeOpts: [10, 20, 50, 100],
                    onPageSizeChange: (size) => setPageSize(size),
                    showTotal: (total) => t('共') + ` ${total} ` + t('条'),
                    showQuickJumper: true,
                    total: logs.length,
                    style: { marginTop: 12 },
                  }}
                />
              )}
            </Spin>
          </Panel>
        </Collapse>
      </Card>
    </>
  );
};

export default UsageToken;
