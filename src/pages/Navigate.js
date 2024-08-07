import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Menu,
  Input,
  Button,
  Typography,
  Popconfirm,
  message,
  Modal,
  Form,
  Select,
  Tooltip,
} from "antd";
import scrollIntoView from "scroll-into-view";
import API from "../services/API";
import { useParams } from "react-router-dom";
import range from "node-range";
import {
  ReloadOutlined,
  MinusCircleOutlined,
  PoweroffOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { FaEthernet, FaHdd, FaProjectDiagram } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import ResponseModal from "../components/ResponseModal";
import DownloadCSV from "../components/DownloadCSV";

const { SubMenu } = Menu;
const { Title } = Typography;
const { Option } = Select;

function NavigatePage() {
  const [permissions, setPermissions] = useState([]);
  const [oltInfo, setOltInfo] = useState({});
  const [currentPon, setCurrentPon] = useState();
  const [onus, setOnus] = useState([]);
  const [found, setFound] = useState(-1);
  const [pending, setPending] = useState([]);
  const [srvPorts, setSrvPorts] = useState([]);
  const [loadPon, setLoadPon] = useState(false);
  const [loadSrvPorts, setLoadSrvPorts] = useState(false);
  const [loadRemSrvPorts, setLoadRemSrvPorts] = useState(false);
  const [loadRefresh, setLoadRefresh] = useState(false);
  const [loadPending, setLoadPending] = useState(false);
  const [loadSearch, setLoadSearch] = useState(false);
  const [loadConfirm, setLoadConfirm] = useState(false);
  const [loadOltInfo, setLoadOltInfo] = useState(true);
  const [loadAdd, setLoadAdd] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showSrv, setShowSrv] = useState(false);
  const [showModalResponse, setShowModalResponse] = useState(false);
  const [responseContent, setResponseContent] = useState("");
  const [oltSlots, setOltSlots] = useState([]);
  const [FormAdd] = Form.useForm();
  const [bridge, setBridge] = useState(true);
  const [t] = useTranslation("common");
  let params = useParams();

  const ponCols = [
    {
      title: t("tables.position"),
      dataIndex: "key",
      key: "key",
      sorter: (a, b) => a.pos.split("/")[2] - b.pos.split("/")[2],
      render: (text) => text.split("/")[text.split("/").length - 1],
      width: "10%",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (text) =>
        text === "Active" ? (
          <Tag
            style={{ width: "6em", textAlign: "center" }}
            color={"mediumseagreen"}
          >
            <b>{t("texts.active")}</b>
          </Tag>
        ) : (
          <Tag style={{ width: "6em", textAlign: "center" }} color={"crimson"}>
            <b>{t("texts.inactive")}</b>
          </Tag>
        ),
      width: "10%",
    },
    {
      title: t("tables.description"),
      dataIndex: "description",
      key: "description",
      sorter: (a, b) => a.description.localeCompare(b.description),
      width: "35%",
    },
    {
      title: t("tables.signal"),
      dataIndex: "signal",
      key: "signal",
      sorter: (a, b) => Number(a.signal) - Number(b.signal),
      render: (text) =>
        parseFloat(text) > -25 ? (
          <Tag
            style={{ width: "5em", textAlign: "center" }}
            color={"mediumseagreen"}
          >
            <b>{text}</b>
          </Tag>
        ) : parseFloat(text) > -28 ? (
          <Tag
            style={{ width: "5em", textAlign: "center" }}
            color={"yellowgreen"}
          >
            <b>{text}</b>
          </Tag>
        ) : (
          <Tag style={{ width: "5em", textAlign: "center" }} color={"crimson"}>
            <b>{text}</b>
          </Tag>
        ),
      width: "10%",
    },
    {
      title: t("tables.serial_number"),
      dataIndex: "sn",
      key: "sn",
      sorter: (a, b) => a.sn.localeCompare(b.sn),
      width: "20%",
    },
    {
      title: t("tables.actions"),
      dataIndex: "actions",
      key: "actions",
      render: (_, record) => {
        return (
          <div>
            <Popconfirm
              title={t("questions.remove_onu")}
              okText="Yes"
              cancelText="No"
              onConfirm={() => removeOnu(record.pos)}
              okButtonProps={{ loading: loadConfirm }}
            >
              {permissions.indexOf("remove_onu") > -1 &&
              oltInfo.vendor !== "Datacom" ? (
                <Tooltip title={t("actions.remove")}>
                  <Button
                    type="text"
                    style={{ marginRight: 8 }}
                    danger
                    icon={<MinusCircleOutlined />}
                    size="small"
                  ></Button>
                </Tooltip>
              ) : null}
            </Popconfirm>
            <Popconfirm
              title={t("questions.reboot_onu")}
              okText="Yes"
              cancelText="No"
              onConfirm={() => rebootOnu(record.pos)}
              okButtonProps={{ loading: loadConfirm }}
            >
              {permissions.indexOf("reboot_onu") > -1 &&
              oltInfo.vendor !== "Datacom" ? (
                <Tooltip title={t("actions.reboot")}>
                  <Button
                    type="text"
                    style={{ marginRight: 8 }}
                    danger
                    icon={<PoweroffOutlined />}
                    size="small"
                  ></Button>
                </Tooltip>
              ) : null}
            </Popconfirm>
            {permissions.indexOf("remove_onu") > -1 &&
            oltInfo.vendor === "Huawei" ? (
              <Tooltip title="Srv. Ports">
                <Button
                  type="text"
                  icon={<FaProjectDiagram style={{ marginRight: 8 }} />}
                  size="small"
                  onClick={() => {
                    setShowSrv(true);
                    setLoadSrvPorts(true);
                    getSrvPorts(
                      currentPon,
                      record.pos.split("/")[record.pos.split("/").length - 1],
                    );
                  }}
                ></Button>
              </Tooltip>
            ) : null}
          </div>
        );
      },
      width: "15%",
    },
  ];

  const pendingCols = [
    {
      title: "PON",
      dataIndex: "pos",
      key: "pos",
      sorter: (a, b) => a.pon.localeCompare(b.pon),
    },
    {
      title: t("tables.serial_number"),
      dataIndex: "sn",
      key: "sn",
      sorter: (a, b) => a.pon.localeCompare(b.pon),
    },
    {
      title: t("tables.actions"),
      dataIndex: "actions",
      key: "actions",
      render: (_, record) => {
        return permissions.indexOf("add") && oltInfo.vendor !== "Huawei" ? (
          <Button onClick={() => toggleAdd(record)} type="primary" size="small">
            {t("texts.add")}
          </Button>
        ) : null;
      },
    },
  ];

  const servicePortsCols = [
    {
      title: "Index",
      dataIndex: "index",
      key: "index",
      sorter: (a, b) => a.pon.localeCompare(b.pon),
    },
    {
      title: "VLAN ID",
      dataIndex: "vlan_id",
      key: "vlan_id",
      sorter: (a, b) => a.pon.localeCompare(b.pon),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => a.pon.localeCompare(b.pon),
    },
    {
      title: t("tables.actions"),
      dataIndex: "actions",
      key: "actions",
      sorter: (a, b) => a.pon.localeCompare(b.pon),
      render: (_, record) => (
        <Popconfirm
          title={t("questions.remove_srv_port")}
          okText={t("texts.yes")}
          cancelText={t("texts.no")}
          onConfirm={() => removeSrvPorts(record.index)}
          okButtonProps={{ loading: loadRemSrvPorts }}
        >
          <Button size="small" danger icon={<MinusCircleOutlined />}>
            {t("actions.remove")}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const toggleAdd = (onu) => {
    FormAdd.setFieldsValue({
      pos: onu.pos,
      serial: onu.sn,
    });
    setShowAdd(true);
  };

  const handleScroll = () => {
    scrollIntoView(document.querySelector(".ant-table-row-selected"));
  };

  useEffect(() => {
    API.get(`/getOlts/${params.id}`).then((res) => {
      setLoadOltInfo(false);
      setOltInfo(res.data);
      let slots = res.data.slots;
      if (slots.split("-")[1]) {
        setOltSlots([Number(slots.split("-")[0]), Number(slots.split("-")[1])]);
      } else {
        setOltSlots([1, Number(slots)]);
      }
    });
    setPermissions(localStorage.getItem("permissions").split(","));
  }, [params.id]);

  const getPon = (pon) => {
    pon =
      pon.split("/").length > 2
        ? `${pon.split("/")[pon.split("/").length - 3]}/${
            pon.split("/")[pon.split("/").length - 2]
          }`
        : pon;
    setCurrentPon(pon);
    API.post(`/exec/${params.id}/pon`, {
      pon: pon,
    })
      .then((res) => {
        setOnus(
          res.data.map((onu) => {
            return {
              key: onu.pos.split("/")[onu.pos.split("/").length - 1],
              ...onu,
            };
          }),
        );
        setLoadPon(false);
        setLoadRefresh(false);
        setLoadSearch(false);
        handleScroll();
      })
      .catch((err) => {
        message.error(err.response.data.message);
      });
  };

  const getPending = () => {
    API.post(`/exec/${params.id}/pending`)
      .then((res) => {
        setPending(res.data);
        setLoadPending(false);
      })
      .catch((err) => {
        message.error(err.response.data.message);
      });
  };

  const rebootOnu = async (pos) => {
    setLoadConfirm(true);
    await API.post(`/exec/${params.id}/reboot`, {
      pos: pos,
    })
      .then((res) => {
        setLoadConfirm(false);
        message.success(
          <span>
            {t("alerts.rebooted_onu")}{" "}
            <Button
              style={{ padding: 4 }}
              type="text"
              onClick={() => {
                setResponseContent(res.data);
                setShowModalResponse(true);
              }}
            >
              <InfoCircleOutlined style={{ margin: 0 }} />
            </Button>
          </span>,
        );
        setLoadPon(true);
        getPon(currentPon);
      })
      .catch(() => {
        setLoadConfirm(false);
      })
      .catch((err) => {
        message.error(err.response.data.message);
      });
  };

  const removeOnu = async (pos) => {
    setLoadConfirm(true);
    await API.post(`/exec/${params.id}/remove`, {
      pos: pos,
    })
      .then((res) => {
        setLoadConfirm(false);
        message.success(
          <span>
            {t("alerts.removed_onu")}{" "}
            <Button
              style={{ padding: 4 }}
              type="text"
              onClick={() => {
                setResponseContent(res.data);
                setShowModalResponse(true);
              }}
            >
              <InfoCircleOutlined style={{ margin: 0 }} />
            </Button>
          </span>,
        );
        setLoadPon(true);
        getPon(currentPon);
      })
      .catch((err) => {
        message.error(err.response.data.message);
      });
  };

  const getOnu = (sn) => {
    if (oltInfo.vendor === "Fiberhome") {
      sn = [sn.slice(0, 4), sn.slice(4)];
      sn = sn[0].toUpperCase() + sn[1].toLowerCase();
    }
    API.post(`/exec/${params.id}/onu`, {
      onu: sn,
    })
      .then((res) => {
        setFound(Number(res.data.split("/")[res.data.split("/").length - 1]));
        setLoadSearch(false);
        setLoadPon(true);
        getPon(res.data.replace("-", "/").replace("\n", ""));
      })
      .catch((err) => {
        setLoadPon(false);
        setLoadSearch(false);
        message.error(err.response.data.message);
      });
  };

  const addOnu = async () => {
    setLoadAdd(true);
    await API.post(`/exec/${params.id}/add`, FormAdd.getFieldsValue())
      .then((res) => {
        setLoadAdd(false);
        setShowAdd(false);
        setLoadPon(true);
        let pos = FormAdd.getFieldValue("pos");
        getPon(`${pos.split("-")[0]}/${pos.split("-")[1]}`);
        message.success(
          <span>
            {t("alerts.added_onu")}{" "}
            <Button
              style={{ padding: 4 }}
              type="text"
              onClick={() => {
                setResponseContent(res.data);
                setShowModalResponse(true);
              }}
            >
              <InfoCircleOutlined style={{ margin: 0 }} />
            </Button>
          </span>,
        );
      })
      .catch(() => {
        setLoadPon(false);
        setLoadAdd(false);
        setShowAdd(false);
        message.error(t("alerts.operation_error"));
      })
      .catch((err) => {
        message.error(err.response.data.message);
      });
  };

  const getSrvPorts = (pon, pos) => {
    API.post(`/exec/${params.id}/sp`, {
      pon: pon,
      pos: pos,
    })
      .then((res) => {
        setSrvPorts(res.data);
        setLoadSrvPorts(false);
      })
      .catch(() => {
        setLoadSrvPorts(false);
        message.error(t("alerts.operation_error"));
      })
      .catch((err) => {
        message.error(err.response.data.message);
      });
  };

  const removeSrvPorts = (idx) => {
    setLoadRemSrvPorts(true);
    API.post(`/exec/${params.id}/rmSp`, {
      idx: idx,
    })
      .then((res) => {
        setLoadRemSrvPorts(false);
        setShowSrv(false);
        message.success(
          <span>
            {t("alerts.removed_srv_port")}{" "}
            <Button
              style={{ padding: 4 }}
              type="text"
              onClick={() => {
                setResponseContent(res.data);
                setShowModalResponse(true);
              }}
            >
              <InfoCircleOutlined style={{ margin: 0 }} />
            </Button>
          </span>,
        );
      })
      .catch(() => {
        setLoadRemSrvPorts(false);
        message.error(t("alerts.operation_error"));
      })
      .catch((err) => {
        message.error(err.response.data.message);
      });
  };

  return (
    <Row style={{ height: "100%", maxHeight: "100%" }}>
      <Col
        span={24}
        style={{
          boxShadow: "0px 0.1em 1em #aaa5",
          overflow: "hidden",
          height: "100%",
          maxHeight: "100%",
        }}
      >
        <Row style={{ height: "100%" }}>
          <Col span={4} style={{ height: "100%" }}>
            <Card
              bodyStyle={{ padding: 0, height: "100%" }}
              style={{ height: "100%" }}
            >
              <Title style={{ marginTop: 10, marginLeft: 20 }} level={5}>
                SLOTS
              </Title>
              <Menu
                mode="inline"
                style={{
                  height: "93%",
                  overflowX: "hidden",
                  overflowY: "scroll",
                }}
              >
                {loadOltInfo ? (
                  <Menu.Item key={0}>
                    <Row
                      style={{ height: "100%" }}
                      justify="center"
                      align="middle"
                    >
                      <Col>
                        <LoadingOutlined />
                      </Col>
                    </Row>
                  </Menu.Item>
                ) : oltInfo.slots ? (
                  range(oltSlots[0], oltSlots[1] + 1).map((slot) => (
                    <SubMenu
                      icon={<FaHdd />}
                      key={`sub${slot}`}
                      title={`Slot ${slot}`}
                    >
                      {range(
                        1 - (oltInfo.vendor === "Huawei" ? 1 : 0),
                        oltInfo.pons + 1,
                      ).map((pon) => (
                        <Menu.Item
                          onClick={() => {
                            setLoadPon(true);
                            getPon(`${slot}/${pon}`);
                          }}
                          icon={<FaEthernet />}
                          key={`i-${slot}-${pon}`}
                        >
                          PON {pon}
                        </Menu.Item>
                      ))}
                    </SubMenu>
                  ))
                ) : null}
              </Menu>
            </Card>
          </Col>
          <Col span={20}>
            <Row gutter={[5, 5]} style={{ height: "100%" }}>
              <Col span={24}>
                <Card bodyStyle={{ padding: 10 }}>
                  <Row justify="space-between">
                    <Col>
                      <Title style={{ margin: 0 }} level={4}>
                        {loadOltInfo ? (
                          <LoadingOutlined />
                        ) : (
                          <>
                            <Tag color="blue">
                              <Title style={{ margin: 0 }} level={5}>
                                {oltInfo.vendor}
                              </Title>
                            </Tag>
                            {oltInfo.name}{" "}
                            {currentPon != null ? "- " + currentPon : null}
                          </>
                        )}
                      </Title>
                    </Col>
                    <Col>
                      <Row gutter={5}>
                        <Col>
                          <DownloadCSV data={onus} fileName="neom-export" />
                        </Col>
                        <Col>
                          <Button
                            loading={loadRefresh}
                            onClick={() => {
                              if (currentPon != null) {
                                setLoadPon(true);
                                setLoadRefresh(true);
                                getPon(currentPon);
                              } else {
                                message.error(t("alerts.no_pon_selected"));
                              }
                            }}
                            type="primary"
                            icon={<ReloadOutlined />}
                          />
                        </Col>
                        <Col>
                          <Input.Search
                            loading={loadSearch}
                            onSearch={(sn) => {
                              setLoadSearch(true);
                              getOnu(sn);
                            }}
                            enterButton
                            placeholder={t("texts.onu_serial")}
                          />
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Card>
                <Table
                  size="small"
                  rowSelection={{
                    type: "radio",
                    selectedRowKeys: [found.toString()],
                    onChange: (selectedRowKeys) => {
                      setFound(selectedRowKeys);
                    },
                  }}
                  columns={ponCols}
                  dataSource={onus}
                  loading={loadPon}
                  pagination={false}
                  scroll={{ y: "50vh" }}
                />
              </Col>
              <Col span={24}>
                <Card bodyStyle={{ padding: 10 }}>
                  <Row justify="space-between">
                    <Col>
                      <Title
                        level={4}
                        style={{ marginBottom: 0, marginLeft: 10 }}
                      >
                        {t("texts.unauthorized")}
                      </Title>
                    </Col>
                    <Col>
                      <Button
                        disabled={oltInfo.vendor === "Datacom"}
                        onClick={() => {
                          setLoadPending(true);
                          getPending();
                        }}
                        loading={loadPending}
                        type="link"
                        icon={<ReloadOutlined />}
                      />
                    </Col>
                  </Row>
                </Card>
                <Table
                  size="small"
                  loading={loadPending}
                  columns={pendingCols}
                  dataSource={pending}
                  pagination={false}
                  scroll={{ y: "21vh" }}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Col>
      <Modal
        title={`${t("texts.add")} ONU`}
        open={showAdd}
        onCancel={() => setShowAdd(false)}
        footer={[
          <Button key={"back"} onClick={() => setShowAdd(false)}>
            {t("texts.cancel")}
          </Button>,
          <Button
            key={"submit"}
            type={"primary"}
            loading={loadAdd}
            onClick={addOnu}
          >
            {t("texts.add")}
          </Button>,
        ]}
      >
        <Form
          form={FormAdd}
          onFinish={addOnu}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
        >
          <Form.Item label="Slot-PON">
            <Input.Group compact>
              <Form.Item name={"pos"} noStyle>
                <Input disabled style={{ width: "40%" }} />
              </Form.Item>
              <Form.Item name={"onuPos"} noStyle>
                <Input style={{ width: "15%" }} />
              </Form.Item>
            </Input.Group>
          </Form.Item>
          <Form.Item name={"serial"} label="Serial">
            <Input disabled />
          </Form.Item>
          <Form.Item name={"desc"} label={t("tables.description") + " 1"}>
            <Input placeholder={t("tables.description")} />
          </Form.Item>
          {oltInfo.vendor === "Nokia" ? (
            <Form.Item name={"desc2"} label={t("tables.description") + " 2"}>
              <Input placeholder={t("tables.description")} />
            </Form.Item>
          ) : null}
          <Form.Item name={"vlan"} label={"VLAN"}>
            <Input placeholder={"VLAN"} />
          </Form.Item>
          <Form.Item name={"type"} label={t("texts.type")}>
            <Select
              placeholder={t("texts.type")}
              onChange={(value) =>
                setBridge(value === "AN5506-01-A1" || value === "bridge")
              }
            >
              {oltInfo.vendor === "Fiberhome" ? (
                <>
                  <Option value="AN5506-01-A1">AN5506-01-A1</Option>
                  <Option value="AN5506-02-F">AN5506-02-F</Option>
                  <Option value="AN5506-02-FA">AN5506-02-FA</Option>
                  <Option value="HG6145E">HG6145E</Option>
                </>
              ) : oltInfo.vendor === "Nokia" ? (
                <>
                  <Option value="router">Router</Option>
                  <Option value="bridge">Bridge</Option>
                </>
              ) : oltInfo.vendor === "ZTE" ? (
                <>
                  <Option value="ZTE-F670L:Router">ZTE-F670L | Router</Option>
                  <Option value="ZTE-F601:Bridge">ZTE-F601 | Bridge</Option>
                </>
              ) : null}
            </Select>
          </Form.Item>
          <Form.Item name={"username"} label={t("texts.user") + " PPPoE"}>
            <Input disabled={bridge} placeholder={t("tables.username")} />
          </Form.Item>
          <Form.Item name={"password"} label={t("texts.password") + " PPPoE"}>
            <Input disabled={bridge} placeholder={t("texts.password")} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Service Ports"
        open={showSrv}
        onCancel={() => setShowSrv(false)}
        footer={false}
      >
        <Table
          size="small"
          loading={loadSrvPorts}
          pagination={false}
          dataSource={srvPorts}
          columns={servicePortsCols}
        />
      </Modal>
      <ResponseModal
        hook={setShowModalResponse}
        open={showModalResponse}
        content={responseContent}
      />
    </Row>
  );
}

export default NavigatePage;
