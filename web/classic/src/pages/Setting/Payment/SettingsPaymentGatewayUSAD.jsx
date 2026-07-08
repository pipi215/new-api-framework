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

import React, { useEffect, useState, useRef } from 'react';
import { Banner, Button, Form, Row, Col, Spin } from '@douyinfe/semi-ui';
import {
  API,
  removeTrailingSlash,
  showError,
  showSuccess,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';

export default function SettingsPaymentGatewayUSAD(props) {
  const { t } = useTranslation();
  const sectionTitle = props.hideSectionTitle ? undefined : t('USAD 设置');
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    UsadApiUrl: '',
    UsadAccessKey: '',
    UsadApiSecret: '',
    UsadUnitPrice: 1.0,
    UsadMinTopUp: 1,
  });
  const [originInputs, setOriginInputs] = useState({});
  const formApiRef = useRef(null);

  useEffect(() => {
    if (props.options && formApiRef.current) {
      const currentInputs = {
        UsadApiUrl: props.options.UsadApiUrl || '',
        UsadAccessKey: props.options.UsadAccessKey || '',
        UsadApiSecret: props.options.UsadApiSecret || '',
        UsadUnitPrice:
          props.options.UsadUnitPrice !== undefined
            ? parseFloat(props.options.UsadUnitPrice)
            : 1.0,
        UsadMinTopUp:
          props.options.UsadMinTopUp !== undefined
            ? parseFloat(props.options.UsadMinTopUp)
            : 1,
      };
      setInputs(currentInputs);
      setOriginInputs({ ...currentInputs });
      formApiRef.current.setValues(currentInputs);
    }
  }, [props.options]);

  const handleFormChange = (values) => {
    setInputs(values);
  };

  const submitUsadSetting = async () => {
    setLoading(true);
    try {
      const options = [];

      if (inputs.UsadApiUrl !== undefined && inputs.UsadApiUrl !== null) {
        options.push({
          key: 'UsadApiUrl',
          value: removeTrailingSlash(inputs.UsadApiUrl),
        });
      }
      if (inputs.UsadAccessKey && inputs.UsadAccessKey !== '') {
        options.push({ key: 'UsadAccessKey', value: inputs.UsadAccessKey });
      }
      if (inputs.UsadApiSecret && inputs.UsadApiSecret !== '') {
        options.push({ key: 'UsadApiSecret', value: inputs.UsadApiSecret });
      }
      if (inputs.UsadUnitPrice !== undefined && inputs.UsadUnitPrice !== null) {
        options.push({
          key: 'UsadUnitPrice',
          value: inputs.UsadUnitPrice.toString(),
        });
      }
      if (inputs.UsadMinTopUp !== undefined && inputs.UsadMinTopUp !== null) {
        options.push({
          key: 'UsadMinTopUp',
          value: inputs.UsadMinTopUp.toString(),
        });
      }

      const requestQueue = options.map((opt) =>
        API.put('/api/option/', {
          key: opt.key,
          value: opt.value,
        }),
      );

      const results = await Promise.all(requestQueue);
      const errorResults = results.filter((res) => !res.data.success);
      if (errorResults.length > 0) {
        errorResults.forEach((res) => {
          showError(res.data.message);
        });
      } else {
        showSuccess(t('更新成功'));
        setOriginInputs({ ...inputs });
        props.refresh?.();
      }
    } catch (error) {
      showError(t('更新失败'));
    }
    setLoading(false);
  };

  return (
    <Spin spinning={loading}>
      <Form
        initValues={inputs}
        onValueChange={handleFormChange}
        getFormApi={(api) => (formApiRef.current = api)}
      >
        <Form.Section text={sectionTitle}>
          <Banner
            type='info'
            icon={<BookOpen size={16} />}
            description={
              <>
                USAD 是链上 USAD 充值渠道，流程为：用户选择 USAD →
                系统查询充值地址 → 用户链上转账 → 用户提交链上 txid →
                系统核对到账并发放额度。
                <br />
                accessKey / apiSecret 由平台对接人线下申请（服务端对服务端），请妥善保存
                apiSecret，切勿泄露。
              </>
            }
            style={{ marginBottom: 16 }}
          />
          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='UsadApiUrl'
                label={t('USAD 网关地址')}
                placeholder={t('例如：https://kai.com/ex-open-api')}
                extraText={t(
                  '上游网关前缀，系统将自动拼接 /openapi/deposit/address 与 /openapi/deposit/verify',
                )}
              />
            </Col>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              <Form.Input
                field='UsadAccessKey'
                label={t('AccessKey')}
                placeholder={t('公开访问标识')}
              />
            </Col>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              <Form.Input
                field='UsadApiSecret'
                label={t('ApiSecret')}
                placeholder={t('HMAC 签名密钥，留空表示保持当前不变')}
                extraText={t('用于计算 sign，保存后不会回显')}
                type='password'
              />
            </Col>
          </Row>
          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.InputNumber
                field='UsadUnitPrice'
                precision={8}
                label={t('额度换算倍率（1 USAD = x 额度）')}
                placeholder={t('例如：1，即 1 USAD 兑换 1 倍 QuotaPerUnit 额度')}
                extraText={t('实际充值额度 = 到账 USAD 数量 × 此倍率 × 单位额度')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.InputNumber
                field='UsadMinTopUp'
                label={t('最低充值 USAD 数量')}
                placeholder={t('例如：1，就是最低充值 1 USAD')}
                extraText={t('用户单次最少可充值的 USAD 数量')}
              />
            </Col>
          </Row>
          <Button onClick={submitUsadSetting} style={{ marginTop: 16 }}>
            {t('更新 USAD 设置')}
          </Button>
        </Form.Section>
      </Form>
    </Spin>
  );
}
