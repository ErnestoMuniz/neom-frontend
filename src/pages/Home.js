import React, { useEffect, useState } from "react";
import {
  Layout,
  Menu,
  Typography,
  Row,
  Col,
  Popover,
  notification,
  Button,
  Divider,
  Avatar,
  Select,
  ConfigProvider,
  theme,
  Switch,
} from "antd";
import { FaHome, FaIdCard, FaKey, FaServer, FaUser } from "react-icons/fa";
import API from "../services/API";
import { Link, useNavigate } from "react-router-dom";
import pkg from "../../package.json";
import getEmoji from "get-random-emoji";
import TypoInlineSVG from "../assets/svgs/TypoInline";
import {
  I18nextProvider,
  initReactI18next,
  useTranslation,
} from "react-i18next";
import i18next from "i18next";
import common_en from "../locales/en/common.json";
import common_pt from "../locales/pt/common.json";
import common_it from "../locales/it/common.json";
import common_de from "../locales/de/common.json";
import enUS from "antd/lib/locale/en_US";
import ptBR from "antd/lib/locale/pt_BR";
import itIT from "antd/lib/locale/it_IT";
import deDE from "antd/lib/locale/de_DE";
import { AlertOutlined, BulbOutlined } from "@ant-design/icons";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
i18next.use(initReactI18next).init({
  interpolation: { escapeValue: false },
  lng: localStorage.getItem("lang")
    ? localStorage.getItem("lang")
    : navigator.language.split("-")[0],
  resources: {
    en: {
      common: common_en,
    },
    pt: {
      common: common_pt,
    },
    it: {
      common: common_it,
    },
    de: {
      common: common_de,
    },
  },
});

const antLangs = {
  en: enUS,
  pt: ptBR,
  it: itIT,
  de: deDE,
};

function HomePage(props) {
  const navigate = useNavigate();
  const [popAvatar, setPopAvatar] = useState(false);
  const [dark, setDark] = useState(
    localStorage.getItem("dark") === "true" ? true : false
  );
  const [emoji] = useState(getEmoji());
  const [t, i18n] = useTranslation("common");
  const [antLocale, setAntlocale] = useState(
    localStorage.getItem("lang")
      ? antLangs[localStorage.getItem("lang")]
      : antLangs[navigator.language.split("-")[0]]
  );
  const [permissions, setPermissions] = useState([]);

  function logout() {
    API.post(`logout`, {
      token: localStorage.getItem("token"),
    })
      .then(() => {
        localStorage.removeItem("name");
        localStorage.removeItem("email");
        localStorage.removeItem("id");
        localStorage.removeItem("role");
        localStorage.removeItem("token");
        navigate("/login");
      })
      .catch((err) => {
        localStorage.removeItem("name");
        localStorage.removeItem("email");
        localStorage.removeItem("id");
        localStorage.removeItem("role");
        localStorage.removeItem("token");
        notification.error({
          message: err.response.data["message"],
        });
        navigate("/login");
      });
  }

  const handleLang = (lang) => {
    localStorage.setItem("lang", lang);
    setAntlocale(antLangs[lang]);
    i18n.changeLanguage(lang);
  };

  const toggleTheme = () => {
    localStorage.setItem("dark", !dark);
    setDark(!dark);
  };

  useEffect(() => {
    setPermissions(localStorage.getItem("permissions").split(","));
  }, []);

  return (
    <I18nextProvider i18n={i18next}>
      <ConfigProvider
        theme={{
          token: {
            fontFamily: "Poppins, NotoColorEmojiLimited",
            colorPrimary: "RoyalBlue"
          },
          algorithm: [dark ? theme.darkAlgorithm : theme.defaultAlgorithm],
        }}
        locale={antLocale}
      >
        <Layout style={{ height: "100%" }}>
          <Header style={{ padding: 0 }}>
            <Row justify="space-between">
              <Col>
                <TypoInlineSVG
                  fill="#fff"
                  style={{
                    display: "block",
                    width: "30%",
                    transform: "translateY(20px) translateX(20px)",
                  }}
                />
              </Col>
              <Col span={4}>
                <Row justify="center" align="middle">
                  <Col>
                    <Switch checked={!dark} onChange={toggleTheme} checkedChildren={<AlertOutlined />} unCheckedChildren={<BulbOutlined />}/>
                  </Col>
                  <Col style={{ color: "white" }}>
                    <Select
                      bordered={false}
                      defaultValue={
                        localStorage.getItem("lang")
                          ? localStorage.getItem("lang")
                          : navigator.language.split("-")[0]
                      }
                      dropdownStyle={{
                        marginRight: 8,
                        color: "white",
                        textAlign: "center",
                      }}
                      className="lang-select"
                      popupClassName="lang-select"
                      onChange={handleLang}
                      options={[
                        {
                          label: <>🇺🇸 English</>,
                          value: "en",
                        },
                        {
                          label: <>🇧🇷 Português</>,
                          value: "pt",
                        },
                        {
                          label: <>🇮🇹 Italiano</>,
                          value: "it",
                        },
                        {
                          label: <>🇩🇪 Deutsch</>,
                          value: "de",
                        },
                      ]}
                    />
                  </Col>
                  <Col>
                    <Popover
                      placement="bottomRight"
                      content={
                        <Row>
                          <Col style={{ textAlign: "center" }}>
                            <Text>
                              {localStorage.getItem("name")} - {emoji}
                            </Text>
                            <br />
                            <Divider
                              style={{ marginTop: 5, marginBottom: 10 }}
                            />
                            <Button onClick={logout} style={{ width: "100%" }}>
                              {t("actions.logout")}
                            </Button>
                          </Col>
                        </Row>
                      }
                      trigger="click"
                      open={popAvatar}
                      onOpenChange={() => setPopAvatar(!popAvatar)}
                    >
                      <Avatar
                        size={40}
                        src={`https://avatars.dicebear.com/api/avataaars/${localStorage.getItem(
                          "name"
                        )}.svg?b=%231a446b`}
                        style={{ cursor: "pointer" }}
                      />
                    </Popover>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Header>
          <Layout>
            <Sider>
              <div className="logo" />
              <Menu theme="dark" defaultSelectedKeys={props.idx}>
                {permissions.indexOf("view_onus") > -1 ? (
                  <Menu.Item key="1" icon={<FaHome />}>
                    <Link to={"/dashboard"}>
                      <b>Dashboard</b>
                    </Link>
                  </Menu.Item>
                ) : null}
                {permissions.indexOf("edit_users") > -1 ? (
                  <Menu.Item key="2" icon={<FaUser />}>
                    <Link to={"/users"}>
                      <b>{t("panel.users")}</b>
                    </Link>
                  </Menu.Item>
                ) : null}
                {permissions.indexOf("edit_roles") > -1 ? (
                  <Menu.Item key="3" icon={<FaIdCard />}>
                    <Link to={"/roles"}>
                      <b>{t("panel.roles")}</b>
                    </Link>
                  </Menu.Item>
                ) : null}
                {permissions.indexOf("edit_permissions") > -1 ? (
                  <Menu.Item key="4" icon={<FaKey />}>
                    <Link to={"/permissions"}>
                      <b>{t("panel.permissions")}</b>
                    </Link>
                  </Menu.Item>
                ) : null}
                {permissions.indexOf("edit_olts") > -1 ? (
                  <Menu.Item key="5" icon={<FaServer />}>
                    <Link to={"/olts"}>
                      <b>OLTs</b>
                    </Link>
                  </Menu.Item>
                ) : null}
              </Menu>
              <Row
                justify="center"
                style={{ position: "absolute", bottom: 10, width: "100%" }}
              >
                <Col style={{ textAlign: "center" }}>
                  <Text
                    style={{ color: "white", fontSize: "1.2em" }}
                    level={5}
                    code
                  >
                    <b>Neom - v{pkg.version}</b>
                  </Text>
                  <br />
                </Col>
              </Row>
            </Sider>
            <Content style={{ padding: 20 }}>{props.page}</Content>
          </Layout>
        </Layout>
      </ConfigProvider>
    </I18nextProvider>
  );
}

export default HomePage;
