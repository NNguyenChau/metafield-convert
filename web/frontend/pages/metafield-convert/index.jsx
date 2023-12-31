import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { read, utils } from 'xlsx'
import MyDropZoneSingle from '../../components/MyDropZoneSingle'
import { Button, LegacyStack, Modal, Spinner } from '@shopify/polaris'
import AppHeader from '../../components/AppHeader'
import MetafieldApi from '../../apis/metafield'
import ProductApi from '../../apis/product'

let requestMetafield = [
  {
    column: 'c_f["recommended"]["string"]',
    metefield: 'custom["complete_the_look"]["product_reference"]',
  },
  {
    column: 'c_f["fabric_details"]["string"]',
    metefield: 'custom["fabric_care"]["multi_line_text_field"]',
  },
]
function IndexPage(props) {
  const [workbook, setWorkbook] = useState(null)
  const [loading, setLoading] = useState(false)

  const getWorkbook = async (file) => {
    try {
      const f = await file.arrayBuffer()
      const wb = read(f) // parse the array buffer

      const ws = wb.Sheets[wb.SheetNames[0]] // get the first worksheet
      let data = utils.sheet_to_json(ws) // generate objects
      data = data.map((item) => {
        let value = {}
        value['handle'] = item['handle']
        requestMetafield.map((element) => {
          value[element.column] = item[element.column] || null
        })

        return value
      })
      setWorkbook(data)
    } catch (error) {
      console.log('error', error)
    }
  }

  const handleConvertMetafield = async ({ data }) => {
    let res = null
    console.time()
    res = await MetafieldApi.importMetafields(data)

    console.log('res:>>', res)
    console.timeEnd()
    setLoading(false)
  }

  const handleCopyMetafields = async () => {
    console.time()
    let res = null

    res = await ProductApi.count()

    let _count = res.data.count
    res = await MetafieldApi.copyMetafields({ count: _count })

    console.log('res:>>', res)
    console.timeEnd()
    setLoading(false)
  }

  // console.log('generate:>>', generateIdFromHandle())

  return (
    <LegacyStack vertical alignment="fill">
      <AppHeader {...props} title="Sartoro Metafield" onBack={() => props.navigate('')} />

      <MyDropZoneSingle onChange={(value) => (value ? getWorkbook(value) : null)} />
      <LegacyStack distribution="trailing">
        <Button
          onClick={() => {
            setLoading(true)
            handleCopyMetafields({ data: workbook })
          }}
        >
          Copy metafields
        </Button>
        <Button
          primary
          onClick={() => {
            setLoading(true)
            handleConvertMetafield({ data: workbook })
          }}
          disabled={!workbook}
        >
          Convert
        </Button>
      </LegacyStack>
      {loading && (
        <div style={{ maxWidth: '100px' }}>
          <Modal
            open={true}
            onClose={() => setLoading(!loading)}
            title="Loading..."
            secondaryActions={[
              {
                content: 'Cancel',
                onAction: () => {
                  setLoading(false)
                },
                destructive: true,
              },
            ]}
          >
            <Modal.Section>
              <Spinner accessibilityLabel="Spinner example" size="large" />
            </Modal.Section>
          </Modal>
        </div>
      )}
    </LegacyStack>
  )
}

IndexPage.propTypes = {}

export default IndexPage
